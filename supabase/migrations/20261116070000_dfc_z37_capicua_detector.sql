-- DFC Z37 / regla universal de capicua / verificacion NO MUTANTE.
-- Esta función NO modifica Z36 ni entrega premios.
-- Solo lee fichas y el estado confirmado por el servidor.

create or replace function public.dfc_z37_is_capicua_hand(p_hand_id bigint)
returns boolean
language plpgsql stable security invoker
set search_path=''
as $$
declare
 h public.rf_domino_hands;
 m public.rf_domino_moves;
 count_tiles integer;
 before_board jsonb;
 left_end integer;
 right_end integer;
 tile_a integer;
 tile_b integer;
 player_tiles jsonb;
begin
 select * into h from public.rf_domino_hands where id=p_hand_id;
 if not found or h.winner_reason is distinct from 'ULTIMA_FICHA' or h.winner_user_id is null then
   return false;
 end if;
 select * into m from public.rf_domino_moves
 where hand_id=p_hand_id and action in ('PLAY','AUTO_PLAY')
 order by id desc limit 1;
 if not found or m.user_id is distinct from h.winner_user_id
    or m.tile is null or jsonb_typeof(m.tile) <> 'array'
    or jsonb_array_length(m.tile) <> 2
    or m.side not in ('left','right') then
    return false;
 end if;
 select tiles into player_tiles
 from public.rf_domino_hand_players where hand_id=p_hand_id and user_id=m.user_id;
 if player_tiles is null or jsonb_typeof(player_tiles)<>'array'
    or jsonb_array_length(player_tiles)<>0 then return false; end if;
 if h.board is null or jsonb_typeof(h.board)<>'array' then return false; end if;
 count_tiles := jsonb_array_length(h.board);
 if count_tiles < 2 then return false; end if;

 -- Retiramos del tablero final la ultima ficha colocada por el ganador.
 if m.side='left' then
   if h.board->0->>'user_id' is distinct from m.user_id::text then return false; end if;
   before_board := (select coalesce(jsonb_agg(h.board->i order by i),'[]'::jsonb)
                    from generate_series(1,count_tiles-1) as i);
 else
   if h.board->(count_tiles-1)->>'user_id' is distinct from m.user_id::text then return false; end if;
   before_board := (select coalesce(jsonb_agg(h.board->i order by i),'[]'::jsonb)
                    from generate_series(0,count_tiles-2) as i);
 end if;

 left_end := (before_board->0->>'a')::integer;
 right_end := (before_board->(jsonb_array_length(before_board)-1)->>'b')::integer;
 tile_a := (m.tile->>0)::integer;
 tile_b := (m.tile->>1)::integer;

 -- Extremos diferentes y la ficha final abarca ambos; doble con
 -- extremos iguales NO satisface esta regla.
 return left_end is not null and right_end is not null
   and left_end <> right_end
   and ((tile_a=left_end and tile_b=right_end)
     or (tile_a=right_end and tile_b=left_end));
end;
$$;

revoke all on function public.dfc_z37_is_capicua_hand(bigint)
from public, anon, authenticated;
