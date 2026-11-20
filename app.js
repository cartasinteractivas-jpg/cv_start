const cfg = window.WEBPOCKET_CONFIG || {};
const adminUrl = cfg.cvAdminUrl || "../cv_admin/?registro=1";
const apiBase = (cfg.apiBaseUrl || "").replace(/\/$/, "");
const edgeFunctionUrl = cfg.edgeFunctionUrl || "https://rrubzwdrsuyjntoejmew.supabase.co/functions/v1/webpocket-api";
const app = document.getElementById("app");
const profiles = [
  { code:"DEMO-01", name:"Alejandro Salazar", role:"Asistente administrativo", location:"Pueblo Libre, Lima", format:"Horizonte Profesional", accent:"#60A5FA", base:"#2563EB", video:"./video_cvoficina.mp4", description:"Orden, comunicaciÃ³n clara y soluciones prÃ¡cticas para oficinas que avanzan.", action:"PregÃºnteme", questions:[["Â¿QuÃ© programas manejas?","Uso hojas de cÃ¡lculo, documentos, correo, calendarios y herramientas de coordinaciÃ³n de oficina."],["Â¿QuÃ© labores realizas?","OrganizaciÃ³n de archivos, atenciÃ³n a clientes, seguimiento y apoyo administrativo."]] },
  { code:"DEMO-02", name:"Marco HuamÃ¡n", role:"Limpieza y mantenimiento", location:"San Miguel, Lima", format:"Minimal Blanco", accent:"#6EE7B7", base:"#059669", video:"./video_cvlimpieza.mp4", description:"Espacios limpios, ordenados y cuidados con puntualidad en cada visita.", action:"PregÃºnteme", questions:[["Â¿QuÃ© tipo de limpieza realizas?","General, profunda, posterior a mudanza y mantenimiento semanal o quincenal."],["Â¿Atiendes hogares y oficinas?","SÃ­, atiendo hogares, oficinas y pequeÃ±os locales previa coordinaciÃ³n."]] },
  { code:"DEMO-03", name:"Dr. Mateo Valdivia", role:"MÃ©dico general", location:"Santiago de Surco, Lima", format:"Salud Serena", accent:"#99F6E4", base:"#0F766E", video:"./video_cvdoctor.mp4", description:"OrientaciÃ³n clara y atenciÃ³n respetuosa enfocada en la prevenciÃ³n.", action:"Consultar al doctor", ai:true },
  { code:"DEMO-04", name:"Carlos Quispe", role:"TÃ©cnico en construcciÃ³n", location:"Villa El Salvador, Lima", format:"Lima Urbana", accent:"#F97316", base:"#111827", video:"./video_cvcontruccion.mp4", description:"Trabajo explicado paso a paso, con acuerdos claros y acabados responsables.", action:"PregÃºnteme", questions:[["Â¿CÃ³mo solicito una cotizaciÃ³n?","EnvÃ­a fotos, medidas aproximadas y el resultado que buscas para coordinar una visita o presupuesto."],["Â¿QuÃ© trabajos realizas?","RemodelaciÃ³n, pintura, pisos, drywall, acabados y mejoras de ambientes."]] },
  { code:"DEMO-05", name:"Dulce Antojo LimeÃ±o", role:"Picarones peruanos", location:"Barranco, Lima", format:"Comida Casera", accent:"#FCA5A5", base:"#DC2626", video:"./video_negocio1.mp4", description:"Picarones reciÃ©n hechos, miel de chancaca y pedidos para compartir.", action:"Ver carta y pedir", whatsapp:"51942000105", productImage:"./webpocket-picarones.png", products:[["Media docena","Picarones artesanales con miel",10],["Docena familiar","Ideal para compartir",18],["Caja mixta","Picarones y buÃ±uelos",16],["Bandeja familiar","Veinticuatro unidades",34],["Pedido para evento","Consulta cantidad y horario",50]] },
  { code:"DEMO-06", name:"Forno Notte", role:"Pizza artesanal", location:"Surquillo, Lima", format:"PizzerÃ­a Nocturna", accent:"#F59E0B", base:"#1C1917", video:"./video_negocio2.mp4", description:"Pizzas artesanales con carta visual, carrito y contacto directo.", action:"Abrir carrito", whatsapp:"51942000106", productImage:"./webpocket-pizza.png", products:[["Pizza clÃ¡sica","Mozzarella, tomate y albahaca",28],["Pizza pepperoni","Pepperoni y salsa casera",33],["Pizza vegetariana","Vegetales frescos y mozzarella",31],["Cuatro quesos","Masa lenta y mezcla de quesos",35],["Combo familiar","Pizza grande y bebida",48]] },
  { code:"DEMO-07", name:"Torque Andino", role:"Servicio automotriz", location:"Ate, Lima", format:"MecÃ¡nico Garage", accent:"#FACC15", base:"#111827", video:"./video_negocio3.mp4", description:"Mantenimiento automotriz explicado sin complicaciones y con atenciÃ³n directa.", action:"Servicios y reservas", whatsapp:"51942000107", productImage:"./webpocket-mecanica.png", products:[["Cambio de aceite","Control bÃ¡sico de niveles",65],["DiagnÃ³stico","EvaluaciÃ³n de alertas",45],["RevisiÃ³n de frenos","InspecciÃ³n preventiva",55],["Alineamiento","DirecciÃ³n y desgaste",70],["Chequeo de viaje","Control antes de carretera",85]], gallery:[['Mantenimiento para principiantes','Lista pÃºblica sobre aceite, baterÃ­a, frenos y neumÃ¡ticos.','https://www.youtube.com/embed/videoseries?list=PLVvgwVry54KeKRaE-UmIp2w5kKnhWHkJp'],['GuÃ­as de frenos','ColecciÃ³n pÃºblica de videos de referencia sobre frenos.','https://www.youtube.com/embed/videoseries?list=PLeJe8IZ6mLZpwMOrghxqoJ8Oc3oAT3hrC'],['DiagnÃ³stico y mantenimiento','Biblioteca pÃºblica de videos automotrices.','https://www.youtube.com/embed/videoseries?list=PLa1nGolaBjZm01CU3QsuXJSGY1IHOaw_S']] },
  { code:"DEMO-08", name:"Tinta Urbana", role:"Polos personalizados", location:"Miraflores, Lima", format:"GalerÃ­a Visual", accent:"#F8FAFC", base:"#E11D48", video:"./video_negocio4.mp4", description:"DiseÃ±os urbanos, prendas personalizadas y una galerÃ­a para vender con estilo.", action:"DiseÃ±ar y pedir", whatsapp:"51942000108", productImage:"./webpocket-polos.png", products:[["Polo personalizado","Estampado simple para equipos",32],["Pack de 10 polos","Para emprendimientos y grupos",280],["Polo oversize","Estampado frontal urbano",42],["Polera estampada","PersonalizaciÃ³n para temporada frÃ­a",76],["Kit de uniforme","Consulta talla, logo y cantidad",150]], gallery:[['ImpresiÃ³n de polos','Lista pÃºblica de tÃ©cnicas de impresiÃ³n para polos.','https://www.youtube.com/embed/videoseries?list=PLO265WIIFik4RxQnjt1bVkejp8cNTtAr1'],['Tutoriales de estampado','GalerÃ­a pÃºblica de referencia de proceso de estampado.','https://www.youtube.com/embed/videoseries?list=PL9tCPtTGUGh_EDE0deM-TjSVic6lWaDSt']] }
];
let state = { index:0, panel:null, cart:{}, profile:null, auctionSelected:null };
let services = { database:"comprobando", ia:"comprobando" };
const escape = text => String(text ?? "").replace(/[&<>\"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character]));
const contrast = hex => { const value=hex.replace("#",""); const [r,g,b]=[0,2,4].map(i=>parseInt(value.slice(i,i+2),16)); return (r*299+g*587+b*114)/1000>155?"#071009":"#f8fafc"; };
const current = () => state.profile || profiles[state.index];
function imageFallback(event){ const element=event.currentTarget;if(element.dataset.fallbackApplied){element.closest(".card")?.classList.add("asset-failed");return}element.dataset.fallbackApplied="true";element.src=`https://raw.githubusercontent.com/cartasinteractivas-jpg/cv_admin/main/${element.dataset.file}`;if(element.tagName==="VIDEO"){element.load();element.play().catch(()=>undefined)} }
function render(){ const p=current(); const styles=`--accent:${p.accent};--onAccent:${contrast(p.accent)};--shape:${p.format.includes("GalerÃ­a")?"999px":p.format.includes("Urbana")?"11px":"17px"}`; const isProfile=Boolean(state.profile); const cards=profiles.map((item,index)=>`<button class="dot ${index===state.index?"active":""}" data-index="${index}" aria-label="Abrir ${escape(item.name)}"></button>`).join(""); app.innerHTML=`<div class="screen" style="${styles}"><section class="card"><video class="backdrop" autoplay muted loop playsinline src="${escape(p.urlvideo||p.video)}" data-file="${escape((p.urlvideo||p.video||"").replace("./", ""))}"></video><div class="veil"></div><header class="top"><div><div class="brand">WebPocket</div><p class="eyebrow">${isProfile?"PERFIL PÃšBLICO":"CV START Â· EJEMPLOS"}</p></div>${isProfile?"":`<span class="count">${String(state.index+1).padStart(2,"0")}/08</span>`}</header>${!isProfile?`<nav class="tabs"><button data-panel="perfil">Perfil</button><button data-panel="${p.ai?"preguntas":"preguntas"}">${p.ai?"Chat IA":"PregÃºnteme"}</button>${p.products?"<button data-panel=\"productos\">Productos</button>":""}${p.gallery?"<button data-panel=\"galeria\">GalerÃ­a</button>":""}</nav>`:""}<section class="content"><p class="format">${escape(p.format||"WebPocket")} Â· ${p.carrito_activo?"CARRITO ACTIVO":"PERFIL ACTIVO"}</p><h1 class="title">${escape(p.negocio||p.nombre||p.name)}</h1><p class="role">${escape(p.giro||p.role||"Perfil WebPocket")}</p><p class="desc">${escape(p.perfil||p.description||"Perfil pÃºblico WebPocket.")}</p><p class="location">âŒ– ${escape(p.direccion||p.location||"Lima, PerÃº")}</p><div class="pills"><button data-panel="perfil">Perfil</button><button data-panel="preguntas">${p.ai?"Chat IA":"Preguntas"}</button>${p.products||p.carrito_activo?"<button data-panel=\"productos\">Carrito</button>":""}${p.gallery?"<button data-panel=\"galeria\">Videos</button>":""}${p.subastas?.length?`<button data-panel="subastas">Subastas (${p.subastas.length})</button>`:""}</div><div class="actions"><button class="primary" data-action="main">${escape(p.action||p.texto_accion_principal||((p.products||p.carrito_activo)?"Ver productos":"PregÃºnteme"))}</button>${isProfile?`<a class="secondary nav-btn" href="${adminUrl}">InscrÃ­bete</a>`:`<button class="secondary" data-action="next">Otro perfil</button>`}</div><footer class="footer">${isProfile?`<a href="${adminUrl}">WEBPOCKET</a>`:`<div class="dots">${cards}</div><a href="${adminUrl}">INSCRÃBETE</a>`}</footer></section>${state.panel?panel(p):""}</section></div>`; app.querySelectorAll(".backdrop,.product img").forEach(element=>element.addEventListener("error",imageFallback)); bind(p); }
function panel(p){ if(state.panel==="subastas")return auctionPanel(p); const shell=p.format?.includes("Urbana")?"drawer":p.format?.includes("GalerÃ­a")?"modal":""; const questions=p.questions||p.preguntas||[]; if(state.panel==="perfil") return `<aside class="panel ${shell}"><header><div><p class="format">INFORMACIÃ“N</p><h2>Perfil</h2></div><button class="close" data-close>Ã—</button></header><p class="desc">${escape(p.perfil||p.description||"")}</p><p class="notice">Este perfil muestra solo los datos configurados por su propietario despuÃ©s de la activaciÃ³n.</p></aside>`; if(state.panel==="preguntas" && p.ai) return `<aside class="panel ${shell}"><header><div><p class="format">CHAT IA</p><h2>OrientaciÃ³n general</h2></div><button class="close" data-close>Ã—</button></header><p class="warning">Este chat ofrece informaciÃ³n general y no reemplaza una evaluaciÃ³n mÃ©dica, diagnÃ³stico, tratamiento o atenciÃ³n de urgencia.</p><div id="chat-log" class="chat-log"><div class="bubble assistant">Hola. Puedo brindar orientaciÃ³n general sobre prevenciÃ³n y controles. Si presentas sÃ­ntomas graves, busca atenciÃ³n de urgencia.</div></div><form id="chat-form" class="chat-form"><input name="question" placeholder="Escribe una consulta general" /><button>Enviar</button></form></aside>`; if(state.panel==="preguntas") return `<aside class="panel ${shell}"><header><div><p class="format">PREGUNTAS</p><h2>PregÃºnteme</h2></div><button class="close" data-close>Ã—</button></header>${questions.length?questions.map(([q,a])=>`<article class="faq"><button><span>${escape(q)}</span><span>â€º</span></button><p hidden>${escape(a)}</p></article>`).join(""):"<p class=\"notice\">Este perfil aÃºn no tiene preguntas pÃºblicas configuradas.</p>"}</aside>`; if(state.panel==="productos") { const list=p.products||p.productos||[]; return `<aside class="panel ${shell}"><header><div><p class="format">CARRITO INTERACTIVO</p><h2>Productos</h2></div><button class="close" data-close>Ã—</button></header><div class="product-list">${list.map((item,index)=>{const [name,detail,price]=Array.isArray(item)?item:[item.descripcion,`Stock: ${item.stock??"consultar"}`,Number(item.precio||0)]; const id=`p-${index}`; return `<article class="product"><img src="${escape(p.productImage||item.foto||"./webpocket-mecanica.png")}" data-file="${escape((p.productImage||item.foto||"webpocket-mecanica.png").replace("./",""))}" alt="${escape(name)}" /><div><h3>${escape(name)}</h3><p>${escape(detail)}</p><strong class="price">S/ ${escape(price)}</strong></div><div class="qty"><button data-qty="${id}" data-step="-1">âˆ’</button><b>${state.cart[id]||0}</b><button data-qty="${id}" data-step="1">+</button></div></article>`}).join("")}</div><button class="primary order" data-order>Continuar pedido</button><p class="notice">Al continuar se abrirÃ¡ el WhatsApp de ${escape(p.negocio||p.name)} con el pedido para que puedas enviarlo.</p></aside>`;} if(state.panel==="galeria") return `<aside class="panel ${shell}"><header><div><p class="format">YOUTUBE Y WEB</p><h2>GalerÃ­a</h2></div><button class="close" data-close>Ã—</button></header><div class="gallery">${(p.gallery||p.galeria_youtube||[]).map((item,index)=>`<a href="${escape(Array.isArray(item)?"https://youtube.com":item.url||"https://youtube.com")}" target="_blank" rel="noreferrer"><b>â–¶</b><div><strong>${escape(Array.isArray(item)?item[0]:item.title||`Video ${index+1}`)}</strong><span>${escape(Array.isArray(item)?item[1]:item.detail||"Video de YouTube")}</span></div></a>`).join("")}</div><p class="notice">El propietario puede configurar varios enlaces de YouTube y su sitio web desde cv_admin.</p></aside>`; return ""; }
function auctionPanel(profile){
  const auctions = Array.isArray(profile.subastas) ? profile.subastas : [];
  const selected = auctions.find((item) => String(item.subasta_id) === String(state.auctionSelected));
  const close = `<button class="close" data-close aria-label="Cerrar">×</button>`;
  if (selected) {
    const fields = Array.isArray(selected.campos_participacion) ? selected.campos_participacion : [];
    const minimum = Number(selected.ofertas_total || 0) > 0
      ? Number(selected.precio_actual || selected.precio_inicial) + Number(selected.incremento_minimo || 1)
      : Number(selected.precio_inicial || 0);
    const fieldHtml = fields.map((field) => {
      const key = String(field.key || "");
      const type = ["text", "tel", "email", "number", "textarea", "select"].includes(field.tipo) ? field.tipo : "text";
      const required = field.obligatorio !== false ? "required" : "";
      const label = escape(field.label || key);
      const input = type === "textarea"
        ? `<textarea name="${escape(key)}" rows="2" ${required}></textarea>`
        : type === "select"
          ? `<select name="${escape(key)}" ${required}><option value="">Selecciona una opción</option>${(field.opciones || []).map((option) => `<option value="${escape(option)}">${escape(option)}</option>`).join("")}</select>`
          : `<input name="${escape(key)}" type="${type}" ${required} ${type === "number" ? "step=any" : ""} autocomplete="${key === "nombre" ? "name" : key === "telefono" ? "tel" : key === "correo" ? "email" : "off"}" />`;
      return `<label class="auction-field"><span>${label}${required ? " *" : ""}</span>${input}</label>`;
    }).join("");
    return `<aside class="panel auction-panel"><header><div><p class="format">${escape(selected.producto || "Producto")}</p><h2>Participar</h2></div>${close}</header>
      <p class="auction-current">Oferta actual <strong>${escape(selected.moneda)} ${Number(selected.precio_actual || selected.precio_inicial).toFixed(2)}</strong></p>
      <p class="notice">Completa los datos solicitados por el negocio y escribe tu oferta. Al enviarla, quedará registrada.</p>
      <form id="auction-participation-form" data-auction-id="${escape(selected.subasta_id)}" data-min-offer="${minimum}" data-increment="${Number(selected.incremento_minimo || 1)}">
        <div class="auction-form-fields">${fieldHtml}</div>
        <label class="auction-field"><span>Tu oferta (${escape(selected.moneda || "PEN")})</span><div class="auction-bid-control"><button type="button" data-auction-step="-1" aria-label="Disminuir oferta">−</button><input name="monto" type="number" min="${minimum.toFixed(2)}" step="0.01" value="${minimum.toFixed(2)}" required /><button type="button" data-auction-step="1" aria-label="Aumentar oferta">+</button></div></label>
        <small class="auction-minimum">Oferta mínima: ${escape(selected.moneda)} ${minimum.toFixed(2)} · Incremento: ${escape(selected.moneda)} ${Number(selected.incremento_minimo || 1).toFixed(2)}</small>
        <button class="primary auction-submit" type="submit">Enviar oferta</button>
      </form>
      <button class="secondary auction-back" type="button" data-auction-back>Volver a subastas</button>
    </aside>`;
  }
  const cards = auctions.map((item) => `<article class="auction-card">
    ${item.foto ? `<img src="${escape(item.foto)}" alt="${escape(item.producto || "Producto en subasta")}" loading="lazy">` : ""}
    <p class="format">${item.estado === "programada" ? "PRÓXIMAMENTE" : "SUBASTA ACTIVA"}</p>
    <h3>${escape(item.producto || "Producto")}</h3>
    ${item.descripcion ? `<p>${escape(item.descripcion)}</p>` : ""}
    <div class="auction-price"><span>Oferta actual</span><strong>${escape(item.moneda || "PEN")} ${Number(item.precio_actual || item.precio_inicial).toFixed(2)}</strong></div>
    <small>${Number(item.ofertas_total || 0)} ofertas · Cierra ${escape(new Date(item.fecha_fin).toLocaleString())}</small>
    <button class="primary" type="button" data-auction-join="${escape(item.subasta_id)}" ${item.estado !== "activa" ? "disabled" : ""}>${item.estado === "activa" ? "Participar" : "Aún no inicia"}</button>
  </article>`).join("");
  return `<aside class="panel auction-panel"><header><div><p class="format">OFERTAS DEL NEGOCIO</p><h2>Subastas</h2></div>${close}</header>${cards || '<p class="notice">Este negocio no tiene subastas abiertas por ahora.</p>'}</aside>`;
}
function invokeMainAction(profile){
  if (profile.accion_principal === "whatsapp") { const number = String(profile.destino_accion_principal || profile.telefono || "").replace(/\D/g, ""); if (number) { window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Hola, vi tu perfil WebPocket: ${profile.negocio || profile.nombre || profile.name}.`)}`, "_blank", "noopener,noreferrer"); return; } }
  state.panel = profile.accion_principal === "ia" || profile.ai || profile.accion_principal === "preguntas" ? "preguntas" : (profile.products || profile.carrito_activo ? "productos" : "preguntas");
  render();
}
function bind(p){
  app.querySelectorAll("[data-index]").forEach(button=>button.addEventListener("click",()=>{state={index:Number(button.dataset.index),panel:null,cart:{},profile:null};render()}));
  app.querySelectorAll("[data-panel]").forEach(button=>button.addEventListener("click",()=>{state.panel=button.dataset.panel;render()}));
  app.querySelectorAll("[data-close]").forEach(button=>button.addEventListener("click",()=>{state.panel=null;render()}));
  app.querySelector("[data-action=next]")?.addEventListener("click",()=>{state={index:(state.index+1)%profiles.length,panel:null,cart:{},profile:null};render()});
  app.querySelector("[data-action=main]")?.addEventListener("click",()=>invokeMainAction(p));
  app.querySelectorAll("[data-auction-join]").forEach(button=>button.addEventListener("click",()=>{state.auctionSelected=button.dataset.auctionJoin;render()}));
  app.querySelector("[data-auction-back]")?.addEventListener("click",()=>{state.auctionSelected=null;render()});
  app.querySelectorAll("[data-auction-step]").forEach(button=>button.addEventListener("click",()=>{const form=button.closest("form");const input=form?.elements.namedItem("monto");if(!input)return;const min=Number(form.dataset.minOffer||input.min||0);const increment=Number(form.dataset.increment||1);const currentValue=Number(input.value||min);input.value=Math.max(min,Math.round((currentValue+Number(button.dataset.auctionStep)*increment)*100)/100).toFixed(2);input.dispatchEvent(new Event("input",{bubbles:true}))}));
  app.querySelector("#auction-participation-form")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const datos={};for(const [key,value] of fd.entries())if(key!=="monto")datos[key]=String(value).trim();const submit=form.querySelector("[type=submit]");if(submit)submit.disabled=true;try{const response=await fetch(edgeFunctionUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_auction_bid",codigo_cliente:p.codigo_cliente||p.codigo,subasta_id:form.dataset.auctionId,monto:Number(fd.get("monto")),datos_participante:datos})});const result=await response.json().catch(()=>({}));if(!response.ok||result.error)throw new Error(result.error||"No se pudo registrar la oferta.");const listResponse=await fetch(edgeFunctionUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_auction_list",codigo_cliente:p.codigo_cliente||p.codigo})});const listResult=await listResponse.json().catch(()=>({}));if(listResult.ok&&Array.isArray(listResult.auctions))p.subastas=listResult.auctions;state.auctionSelected=null;render();window.alert("Tu oferta se registró correctamente.")}catch(error){window.alert(error.message||"No se pudo enviar la oferta.");if(submit)submit.disabled=false}});
  app.querySelectorAll(".faq button").forEach(button=>button.addEventListener("click",()=>{const answer=button.parentElement.querySelector("p");answer.hidden=!answer.hidden}));
  app.querySelectorAll("[data-qty]").forEach(button=>button.addEventListener("click",()=>{const id=button.dataset.qty;state.cart[id]=Math.max(0,(state.cart[id]||0)+Number(button.dataset.step));render()}));
  app.querySelectorAll(".product").forEach(card=>card.addEventListener("click",event=>{if(event.target instanceof Element&&event.target.closest("button"))return;card.querySelector('[data-step="1"]')?.click()}));
  app.querySelector("[data-order]")?.addEventListener("click",()=>{const products=p.products||p.productos||[];const selected=Object.entries(state.cart).filter(([,quantity])=>quantity>0);if(!selected.length){alert("Toca un producto o el botÃ³n + para agregarlo al pedido.");return}const lines=selected.map(([id,quantity])=>{const item=products[Number(id.replace("p-",""))];const name=Array.isArray(item)?item[0]:item.descripcion;const price=Array.isArray(item)?item[2]:Number(item.precio||0);return `â€¢ ${quantity} x ${name} â€” S/ ${quantity*price}`});const detail=[`Pedido para ${p.negocio||p.name}:`,...lines,"",`Esto abrirÃ¡ el WhatsApp de ${p.negocio||p.name}. El mensaje no se enviarÃ¡ automÃ¡ticamente.`].join("\n");if(!window.confirm(detail))return;const whatsapp=p.destino_accion_principal||p.whatsapp||p.telefono||"51942000000";window.open(`https://wa.me/${String(whatsapp).replace(/\D/g,"")}?text=${encodeURIComponent([`Hola, quiero pedir a ${p.negocio||p.name}:`,...lines].join("\n"))}`,"_blank","noopener,noreferrer")});
  const form=app.querySelector("#chat-form");if(form)form.addEventListener("submit",async event=>{event.preventDefault();const input=form.elements.question;const question=input.value.trim();if(!question)return;const log=app.querySelector("#chat-log");log.insertAdjacentHTML("beforeend",`<div class=\"bubble user\">${escape(question)}</div>`);input.value="";try{if(!apiBase||apiBase.includes("TU-DOMINIO"))throw Error();const response=await fetch(`${apiBase}/api/trpc/webpocket.askAssistant?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":{"question":question,"knowledge":"Perfil de mÃ©dico general. Ofrece educaciÃ³n sanitaria general, no diagnÃ³sticos ni urgencias.","model":"openrouter/auto"}}}))}`);const data=await response.json();const answer=data?.[0]?.result?.data?.json||"No se pudo obtener una respuesta.";log.insertAdjacentHTML("beforeend",`<div class=\"bubble assistant\">${escape(answer)}</div>`)}catch{log.insertAdjacentHTML("beforeend","<div class=\"bubble assistant\">El chat requiere que configures apiBaseUrl con la direcciÃ³n publicada de cv_admin.</div>")}log.scrollTop=log.scrollHeight});
}
function serviceClass(value){return value==="conectada"||value==="lista"?"ok":value==="comprobando"?"loading":"warn";}
function youtubeEmbed(url){const raw=String(url||"");if(raw.includes("/embed/videoseries?list="))return raw;const match=raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);return match?`https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`:"";}
function injectServiceStatus(){const header=app.querySelector(".top > div");if(!header)return;const box=document.createElement("div");box.className="service-status";box.innerHTML=`<span class="${serviceClass(services.database)}">BD ${escape(services.database)}</span><span class="${serviceClass(services.ia)}">IA ${escape(services.ia)}</span>`;header.appendChild(box);}
async function checkServices(){if(!apiBase||apiBase.includes("TU-DOMINIO")){services={database:"sin servidor",ia:"sin servidor"};if(!state.profile)render();return}try{const response=await fetch(`${apiBase}/api/webpocket/status`,{cache:"no-store"});if(!response.ok)throw Error();const status=await response.json();services={database:status?.supabaseOnline?"conectada":"sin conexiÃ³n",ia:status?.openRouterOnline?"lista":"sin conexiÃ³n"};}catch{services={database:"sin conexiÃ³n",ia:"sin conexiÃ³n"};}if(!state.profile)render();}
const initialRender = render;
render = function(){
  initialRender();
  injectServiceStatus();
  const video = app.querySelector(".backdrop");
  if (video) {
    video.setAttribute("poster", `./${String(video.dataset.file || "").replace(/\.mp4$/i, ".jpg")}`);
    video.addEventListener("error", () => {
      const file = String(video.dataset.file || "");
      if (!video.dataset.remote && file) {
        video.dataset.remote = "1";
        video.src = `https://raw.githubusercontent.com/cartasinteractivas-jpg/cv_start/main/${file}`;
        video.play().catch(() => undefined);
        return;
      }
      const warning = document.createElement("p");
      warning.className = "video-warning";
      warning.textContent = "El video no estÃ¡ disponible por ahora. Se muestra la imagen de respaldo.";
      app.querySelector(".top")?.appendChild(warning);
    }, { once: false });
  }
  const profile = current();
  if (state.panel === "galeria") {
    const gallery = app.querySelector(".gallery");
    const videos = profile.gallery || profile.galeria_youtube || [];
    if (gallery) gallery.innerHTML = videos.map((item, index) => {
      const title = Array.isArray(item) ? item[0] : item.title || `Video ${index + 1}`;
      const detail = Array.isArray(item) ? item[1] : item.detail || "Video de YouTube";
      const url = Array.isArray(item) ? item[2] : item.url;
      const source = youtubeEmbed(url);
      return source ? `<article class="gallery-video"><iframe src="${escape(source)}" title="${escape(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><div><strong>${escape(title)}</strong><span>${escape(detail)}</span></div></article>` : `<article class="gallery-video"><div><strong>${escape(title)}</strong><span>${escape(detail)}</span></div></article>`;
    }).join("");
  }
  const seed = Array.from(String(profile.format || profile.codigo_cliente || "WebPocket")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  const base = profile.base || profile.color_fondo || "#0b1020";
  const screen = app.querySelector(".screen");
  const tabs = app.querySelector(".tabs");
  const content = app.querySelector(".content");
  if (!screen) return;
  const menu = ["transparent", "rgba(2,4,10,.38)", `${base}e8`, `linear-gradient(130deg, ${base}bd, rgba(5,8,16,.78))`][seed];
  const panel = ["rgba(6,10,19,.95)", `linear-gradient(145deg, ${base}df, rgba(5,9,19,.96))`, "rgba(11,14,23,.97)", `linear-gradient(180deg, rgba(8,12,24,.96), ${base}bd)`][seed];
  screen.style.setProperty("--menuBg", menu);
  screen.style.setProperty("--panelBg", panel);
  if (!tabs || !content) return;
  if (seed === 1) { tabs.style.left = "auto"; tabs.style.right = "18px"; tabs.style.width = "128px"; tabs.style.top = "104px"; tabs.style.flexDirection = "column"; content.style.inset = "165px 155px 18px 18px"; }
  if (seed === 2) { tabs.style.left = "18px"; tabs.style.right = "auto"; tabs.style.width = "128px"; tabs.style.top = "104px"; tabs.style.flexDirection = "column"; content.style.inset = "165px 18px 18px 155px"; }
  if (seed === 3) { tabs.style.top = "auto"; tabs.style.bottom = "190px"; content.style.inset = "180px 18px 260px"; }
};
async function loadProfile(){
  const code=new URLSearchParams(location.search).get("perfil");
  if(!code){render();return}
  if(!edgeFunctionUrl){app.innerHTML='<div class="empty"><article><h1>Configuración pendiente</h1><p>Falta conectar el servidor WebPocket.</p></article></div>';return}
  try{
    const response=await fetch(edgeFunctionUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_profile",codigo_cliente:code})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw new Error(data.error||"No se pudo cargar el perfil.");
    const publicProfile=data.profile||{};
    const questions=(data.questions||[]).filter((item)=>String(item.tipo_contenido||"").toUpperCase()==="PREGUNTA").map((item)=>[item.pregunta||"",item.respuesta||""]);
    const gallery=(data.links||[]).filter((item)=>item.visible!==false).map((item)=>[item.titulo||"Video",item.tipo_enlace||"Video",item.url||item.valor_enlace||""]);
    state.profile={...publicProfile,name:publicProfile.nombre||publicProfile.negocio||"WebPocket",role:publicProfile.giro||publicProfile.tipo_perfil||"Perfil WebPocket",location:publicProfile.direccion||"",format:"WebPocket",accent:publicProfile.color_principal||"#38bdf8",base:publicProfile.color_fondo||"#07101e",whatsapp:publicProfile.telefono||"",ai:/IA|CHAT/i.test(String(publicProfile.modalidad||""))||Boolean(publicProfile.ia_prompt||publicProfile.ia_conocimiento),products:data.products||[],questions,gallery,subastas:data.auctions||publicProfile.subastas||[]};
    state.panel=null;state.auctionSelected=null;render();
  }catch(error){app.innerHTML=`<div class="empty"><article><p class="format">PERFIL NO DISPONIBLE</p><h1>No pudimos cargar esta página</h1><p>${escape(error.message||"Revisa el enlace o intenta nuevamente.")}</p><a class="primary nav-btn" href="${adminUrl}">Volver a WebPocket</a></article></div>`}
}
loadProfile();
checkServices();


