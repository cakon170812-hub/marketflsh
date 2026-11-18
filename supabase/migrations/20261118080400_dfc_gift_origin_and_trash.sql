alter table public.dfc_z31_gift_cards
 add column origin_name text,
 add column origin_detail text,
 add column trash_cleared_at timestamptz;

create function public.dfc_gift_card_details_v1(p_gift_id uuid)
returns table(origin_name text,origin_detail text)
language sql stable security definer set search_path=''
as $$
 select coalesce(c.origin_name,case when c.campaign_id is not null then 'Tarjeta de campaña' else 'Tarjeta FlashCoin' end),c.origin_detail
 from public.dfc_z31_gift_cards c where c.id=p_gift_id and c.recipient_id=auth.uid();
$$;

create function public.dfc_gift_trash_v1()
returns table(gift_id uuid, amount numeric, origin_name text, expires_at timestamptz)
language sql stable security definer set search_path=''
as $$
 select c.id,c.amount,coalesce(c.origin_name,'Tarjeta FlashCoin'),c.expires_at
 from public.dfc_z31_gift_cards c
 where c.recipient_id=auth.uid() and c.redeemed_at is null
   and c.expired_acknowledged_at is not null and c.trash_cleared_at is null
 order by c.expired_acknowledged_at desc,c.id limit 100;
$$;

create function public.dfc_gift_trash_clear_v1(p_ids uuid[])
returns integer
language sql volatile security definer set search_path=''
as $$
 with removed as (
   update public.dfc_z31_gift_cards c set trash_cleared_at=now()
   where c.recipient_id=auth.uid() and c.id=any(p_ids)
     and c.redeemed_at is null and c.expired_acknowledged_at is not null
     and c.trash_cleared_at is null
   returning 1
 ) select count(*)::integer from removed;
$$;

revoke all on function public.dfc_gift_card_details_v1(uuid),public.dfc_gift_trash_v1(),public.dfc_gift_trash_clear_v1(uuid[]) from public,anon,authenticated,service_role;
grant execute on function public.dfc_gift_card_details_v1(uuid),public.dfc_gift_trash_v1(),public.dfc_gift_trash_clear_v1(uuid[]) to authenticated;
