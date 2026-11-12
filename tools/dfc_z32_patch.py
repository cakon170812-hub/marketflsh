#!/usr/bin/env python3
"""Integración web Z32 no destructiva. Modifica solo marcadores conocidos."""
from pathlib import Path
import re
p=Path("index.html")
html=p.read_text(encoding="utf-8")
before=html

loader='<script src="./script.js?v=0.12Z.32" defer></script>'
if re.search(r'<script\b[^>]*src=["\'](?:\./)?script\.js(?:\?[^"\']*)?["\']',html,re.I):
    html=re.sub(r'<script\b[^>]*src=["\'](?:\./)?script\.js(?:\?[^"\']*)?["\'][^>]*></script>',loader,html,count=1,flags=re.I)
else:
    assert html.lower().count("</body>")==1,"No hay un cierre único del documento"
    html=html.replace("</body>",loader+"\n</body>",1)

# Actualizar textos ya conocidos de capicúa sin cambiar lógica de la partida.
html=html.replace("Verificando tu bono adicional del 1%…","Tu bono del 10% aparecerá en una tarjeta para reclamar.")
html=html.replace("de bono especial (1% del bote), acreditados al ","de bono especial (10% del bote), acreditados al ")
html=html.replace("Bono especial de '+mfCash(data.amount)+' pendiente de fondos administrativos; aún no acreditado.","Bono especial del 10%: '+mfCash(data.amount)+' FC. Reclama la tarjeta Flash Coin cuando aparezca.")
html=html.replace("<!-- Domino Flash Coin 1.5: capicua 1% en mesa, sonido y realtime. -->","<!-- Domino Flash Coin Z32: tarjeta capicua 10%, sonidos y realtime. -->")

# Rescate seguro: solo se revalida un ID observado si el servidor confirma
# que la modalidad sigue activa y la mesa es visible.
old="""const observed=(fresh.tables||[]).find(t=>Number(t.id)===observedId);
           if(!observed)throw new Error('Esta mesa dejó de estar disponible. Vuelve al listado.');"""
new="""let observed=(fresh.tables||[]).find(t=>Number(t.id)===observedId);
           if(!observed){
             const {data:check,error:checkError}=await sb.rpc('rf_domino_table_availability_z32',{p_table_id:observedId});
             if(checkError || !check?.available)throw new Error('Esta mesa no está disponible. Vuelve al listado.');
             observed={id:observedId,config_id:Number(check.config_id)};
           }"""
if old in html:
    html=html.replace(old,new,1)
else:
    print("AVISO: se omitió el cambio de mesas, el marcador HTML cambió; revisar manualmente.")

assert 'dfcZ32Audio' not in html or loader in html
assert len(html)>2_000_000,"HTML más pequeño que la base esperada"
assert html.lower().count("</html>")==1,"HTML inválido: cierre duplicado"
if html!=before:
    p.write_text(html,encoding="utf-8")
    print("Z32: index.html integrado",len(before),"->",len(html))
else:
    print("Z32: index.html ya estaba integrado")
