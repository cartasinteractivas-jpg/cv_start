/* WebPocket cv_start — config */

      const EDGE =
        "https://rrubzwdrsuyjntoejmew.supabase.co/functions/v1/webpocket-api";
      const REGISTRO_URL =
        "https://cartasinteractivas-jpg.github.io/cv_admin/?registro=1";
      const IMAGES = [
        "webpocket-picarones.png",
        "webpocket-pizza.jpg",
        "webpocket-mecanica.jpg",
        "webpocket-polos.jpg",
      ];
      /* Rutas relativas al repo cv_start (mismo directorio que index.html) */
      const VIDEOS = [
        "video_cvoficina.mp4",
        "video_cvlimpieza.mp4",
        "video_cvdoctor.mp4",
        "video_cvcontruccion.mp4",
        "video_negocio1.mp4",
        "video_negocio2.mp4",
        "video_negocio3.mp4",
        "video_negocio4.mp4",
      ];
      const FALLBACK = [
        { id: "a1000001-0000-4000-8000-000000000001", nombre: "Horizonte Profesional", posicion_navegacion: "superior", estilo_tarjetas: "tarjetas_limpias", color_principal: "#38BDF8", color_secundario: "#818CF8" },
        { id: "a1000001-0000-4000-8000-000000000002", nombre: "Neon Pocket", posicion_navegacion: "flotante_derecha", estilo_tarjetas: "tarjetas_translucidas", color_principal: "#22D3EE", color_secundario: "#E879F9" },
        { id: "a1000001-0000-4000-8000-000000000003", nombre: "Tienda Lateral", posicion_navegacion: "lateral_izquierda", estilo_tarjetas: "tarjetas_producto", color_principal: "#F97316", color_secundario: "#FBBF24" },
        { id: "a1000001-0000-4000-8000-000000000004", nombre: "Tik Pocket", posicion_navegacion: "lateral_derecha", estilo_tarjetas: "pantalla_completa", color_principal: "#F43F5E", color_secundario: "#2DD4BF" },
        { id: "a1000001-0000-4000-8000-000000000005", nombre: "Carrusel Horizontal", posicion_navegacion: "inferior", estilo_tarjetas: "tarjetas_deslizables", color_principal: "#A855F7", color_secundario: "#F472B6" },
        { id: "a1000001-0000-4000-8000-000000000006", nombre: "Tarjetas Apiladas", posicion_navegacion: "superior", estilo_tarjetas: "tarjetas_grandes", color_principal: "#10B981", color_secundario: "#34D399" },
        { id: "a1000001-0000-4000-8000-000000000007", nombre: "Minimal Blanco", posicion_navegacion: "superior", estilo_tarjetas: "sin_tarjeta", color_principal: "#94A3B8", color_secundario: "#CBD5E1" },
        { id: "a1000001-0000-4000-8000-000000000008", nombre: "Retro Cálido", posicion_navegacion: "inferior_fijo", estilo_tarjetas: "tarjetas_colores", color_principal: "#EAB308", color_secundario: "#EA580C" },
        { id: "a1000001-0000-4000-8000-000000000009", nombre: "Lima Urbana", posicion_navegacion: "flotante_izquierda", estilo_tarjetas: "tarjetas_bloque", color_principal: "#0EA5E9", color_secundario: "#6366F1" },
        { id: "a1000001-0000-4000-8000-000000000010", nombre: "Salud Serena", posicion_navegacion: "superior", estilo_tarjetas: "tarjetas_serenas", color_principal: "#14B8A6", color_secundario: "#2DD4BF" },
        { id: "a1000001-0000-4000-8000-000000000011", nombre: "Glow Magenta", posicion_navegacion: "flotante_derecha", estilo_tarjetas: "tarjetas_mosaico", color_principal: "#DB2777", color_secundario: "#C084FC" },
        { id: "a1000001-0000-4000-8000-000000000012", nombre: "Pocket Ejecutivo", posicion_navegacion: "superior", estilo_tarjetas: "tarjetas_elegantes", color_principal: "#6366F1", color_secundario: "#A78BFA" },
        { id: "a1000001-0000-4000-8000-000000000013", nombre: "Carrito Swipe", posicion_navegacion: "inferior", estilo_tarjetas: "carrito_swipe", color_principal: "#F59E0B", color_secundario: "#EF4444" },
        { id: "a1000001-0000-4000-8000-000000000014", nombre: "Carrito Grilla", posicion_navegacion: "superior", estilo_tarjetas: "carrito_grilla", color_principal: "#22C55E", color_secundario: "#86EFAC" },
        { id: "a1000001-0000-4000-8000-000000000015", nombre: "Carrito Lista", posicion_navegacion: "lateral_izquierda", estilo_tarjetas: "carrito_lista", color_principal: "#0EA5E9", color_secundario: "#38BDF8" },
        { id: "a1000001-0000-4000-8000-000000000016", nombre: "Carrito Vitrina", posicion_navegacion: "flotante_derecha", estilo_tarjetas: "carrito_vitrina", color_principal: "#A855F7", color_secundario: "#F472B6" },
        { id: "a1000001-0000-4000-8000-000000000017", nombre: "Carrito Market", posicion_navegacion: "inferior_fijo", estilo_tarjetas: "carrito_market", color_principal: "#E11D48", color_secundario: "#FB7185" },
        { id: "a1000001-0000-4000-8000-000000000018", nombre: "Carrito Dark Pro", posicion_navegacion: "superior", estilo_tarjetas: "carrito_grilla", color_principal: "#FBBF24", color_secundario: "#F59E0B" },
        { id: "a1000001-0000-4000-8000-000000000019", nombre: "Comida Casera", posicion_navegacion: "superior", estilo_tarjetas: "tarjetas_comida", color_principal: "#DC2626", color_secundario: "#FCA5A5" },
        { id: "a1000001-0000-4000-8000-000000000020", nombre: "Taller Industrial", posicion_navegacion: "lateral_izquierda", estilo_tarjetas: "tarjetas_tecnicas", color_principal: "#FACC15", color_secundario: "#1D4ED8" },
      ];
      const DEMOS = [
        {
          numero_perfil: 1,
          nombre: "Alejandro Salazar",
          categoria: "Asistente administrativo",
          perfil: "Orden, comunicación clara y soluciones prácticas para oficinas que avanzan.",
          tipo_perfil: "CV",
          telefono: "987654321",
          dni: "45678912",
          video: VIDEOS[0],
          formatIndex: 0,
          formato_id: "a1000001-0000-4000-8000-000000000001",
          color_principal: "#38BDF8",
          color_secundario: "#818CF8",
          experiencia: [
            { cargo: "Asistente administrativo", empresa: "Oficinas Andinas SAC", periodo: "2022 – Actual", detalle: "Gestión de agenda, clientes y documentos." },
            { cargo: "Recepcionista", empresa: "Clínica Surco", periodo: "2020 – 2022", detalle: "Citas y archivo digital." },
            { cargo: "Auxiliar de oficina", empresa: "Estudio Contable Lima", periodo: "2018 – 2020", detalle: "Archivo y facturación básica." },
            { cargo: "Practicante", empresa: "Municipalidad Pueblo Libre", periodo: "2017 – 2018", detalle: "Trámite documentario." },
            { cargo: "Asistente de ventas", empresa: "Retail Express", periodo: "2016 – 2017", detalle: "Atención al público." },
          ],
          preguntas: [
            ["¿Cuál es tu especialidad?", "Asistencia administrativa y organización de procesos."],
            ["¿Qué herramientas manejas?", "Excel, Google Workspace y CRM básicos."],
            ["¿Experiencia con clientes?", "Sí, presencial y telefónica."],
            ["¿Manejas agenda?", "Sí, citas, recordatorios y actas."],
            ["¿Disponibilidad?", "Tiempo completo y horarios extendidos."],
            ["¿Trabajas bajo presión?", "Sí, priorizo sin perder orden."],
            ["¿Redactas documentos?", "Cartas, informes y correos formales."],
            ["¿Trámites municipales?", "Experiencia básica en mesas de partes."],
            ["¿Puedes empezar ya?", "Sí, inicio inmediato."],
            ["¿Referencias?", "Sí, de mis dos últimos empleos."],
          ],
        },
        {
          numero_perfil: 2,
          nombre: "Marco Huamán",
          categoria: "Operario de limpieza",
          perfil: "Responsable, puntual y enfocado en espacios seguros y ordenados.",
          tipo_perfil: "CV",
          telefono: "912345678",
          dni: "12345678",
          video: VIDEOS[1],
          formatIndex: 1,
          formato_id: "a1000001-0000-4000-8000-000000000002",
          color_principal: "#22D3EE",
          color_secundario: "#E879F9",
          experiencia: [
            { cargo: "Operario de limpieza", empresa: "CleanPro Lima", periodo: "2021 – Actual", detalle: "Oficinas y áreas comunes." },
            { cargo: "Mantenimiento", empresa: "Condominio Los Álamos", periodo: "2019 – 2021", detalle: "Limpieza diaria." },
            { cargo: "Ayudante", empresa: "Colegio San Martín", periodo: "2017 – 2019", detalle: "Aulas y patios." },
            { cargo: "Limpieza residencial", empresa: "Independiente", periodo: "2016 – 2017", detalle: "Casas por horas." },
            { cargo: "Auxiliar almacén", empresa: "Distribuidora Norte", periodo: "2015 – 2016", detalle: "Orden y limpieza." },
          ],
          preguntas: [
            ["¿Qué experiencia tienes?", "Residencial, oficinas y áreas comunes."],
            ["¿Disponibilidad?", "Mañana, tarde o fines de semana."],
            ["¿Productos profesionales?", "Sí, desinfectantes y protocolos."],
            ["¿Condominios?", "Sí, lobby y estacionamientos."],
            ["¿Horario flexible?", "Sí."],
            ["¿Referencias?", "Sí, de clientes anteriores."],
            ["¿Cobertura?", "SJL, Ate y alrededores."],
            ["¿Cómo cotizas?", "Según metros y frecuencia."],
            ["¿Implementos propios?", "Básicos; el resto se coordina."],
            ["¿Inicio?", "Según agenda, a menudo la misma semana."],
          ],
        },
        {
          numero_perfil: 3,
          nombre: "Dr. Mateo Valdivia",
          categoria: "Médico general",
          perfil: "Orientación clara y atención respetuosa enfocada en la prevención.",
          tipo_perfil: "CV",
          telefono: "998877665",
          dni: "11223344",
          video: VIDEOS[2],
          formatIndex: 9,
          formato_id: "a1000001-0000-4000-8000-000000000010",
          color_principal: "#14B8A6",
          color_secundario: "#2DD4BF",
          experiencia: [
            { cargo: "Médico general", empresa: "Clínica Surco Salud", periodo: "2020 – Actual", detalle: "Consulta ambulatoria." },
            { cargo: "Médico de turno", empresa: "Centro de Salud", periodo: "2017 – 2020", detalle: "Atención primaria." },
            { cargo: "Internado", empresa: "Hospital Nacional", periodo: "2016 – 2017", detalle: "Medicina interna." },
            { cargo: "Voluntariado", empresa: "Campañas", periodo: "2015 – 2016", detalle: "Prevención comunitaria." },
            { cargo: "Asistente investigación", empresa: "Universidad", periodo: "2014 – 2015", detalle: "Salud pública." },
          ],
          preguntas: [
            ["¿Qué servicio brinda?", "Orientación general y prevención."],
            ["¿Emergencias aquí?", "No. Ante urgencias acude a un centro de salud."],
            ["¿Prescribe aquí?", "No. Solo orientación."],
            ["¿Prevención?", "Controles, vacunas y hábitos."],
            ["¿Síntomas?", "Orientación general; si hay gravedad, presencial."],
            ["¿Niños?", "Orientación general; pediatría con especialista."],
            ["¿Certificados?", "Solo en consulta presencial."],
            ["¿Telemedicina?", "Este canal es orientación, no teleconsulta."],
            ["¿Fiebre alta?", "Hidratación; si persiste, centro de salud."],
            ["¿Horarios?", "Coordina por el contacto del perfil."],
          ],
        },
        {
          numero_perfil: 4,
          nombre: "Carlos Quispe",
          categoria: "Maestro de obra",
          perfil: "Construcción, acabados y remodelaciones con coordinación directa.",
          tipo_perfil: "CV",
          telefono: "955443322",
          dni: "55667788",
          video: VIDEOS[3],
          formatIndex: 8,
          formato_id: "a1000001-0000-4000-8000-000000000009",
          color_principal: "#0EA5E9",
          color_secundario: "#6366F1",
          experiencia: [
            { cargo: "Maestro de obra", empresa: "Constructora del Sur", periodo: "2019 – Actual", detalle: "Acabados y cuadrillas." },
            { cargo: "Oficial albañil", empresa: "Remodelaciones Lima", periodo: "2015 – 2019", detalle: "Muros y enchapes." },
            { cargo: "Ayudante de obra", empresa: "Proyectos VES", periodo: "2012 – 2015", detalle: "Estructuras." },
            { cargo: "Pintor", empresa: "Independiente", periodo: "2011 – 2012", detalle: "Interior y exterior." },
            { cargo: "Enchapador", empresa: "Acabados Pro", periodo: "2010 – 2011", detalle: "Baños y cocinas." },
          ],
          preguntas: [
            ["¿Qué trabajos realizas?", "Construcción, acabados, enchapes y pintura."],
            ["¿Cómo cotizas?", "Visita o medidas para cotización clara."],
            ["¿Cuadrilla?", "Sí, según el tamaño del trabajo."],
            ["¿Baños?", "Sí, demolición controlada y enchape."],
            ["¿Pintura?", "Sí, preparación y acabado."],
            ["¿Plazos?", "Se acuerdan al inicio."],
            ["¿Zonas?", "VES, Villa María y alrededores."],
            ["¿Garantía?", "Por mano de obra según lo pactado."],
            ["¿Materiales?", "Del cliente o cotizo suministro."],
            ["¿Inicio?", "Frecuentemente en la misma semana."],
          ],
        },
        {
          numero_perfil: 5,
          nombre: "Dulce Antojo Limeño",
          negocio: "Dulce Antojo Limeño",
          categoria: "Picarones peruanos",
          perfil: "Picarones artesanales recién hechos para reuniones y antojos.",
          direccion: "Breña, Lima",
          maps: "https://maps.google.com/?q=Breña,+Lima",
          tipo_perfil: "NEGOCIO",
          telefono: "999111222",
          video: VIDEOS[4],
          formatIndex: 12,
          formato_id: "a1000001-0000-4000-8000-000000000013",
          estilo_tarjetas: "carrito_swipe",
          color_principal: "#F59E0B",
          color_secundario: "#EF4444",
          products: [
            { descripcion: "Picarones clásicos", precio: 12, stock: 40, foto: "webpocket-picarones.png" },
            { descripcion: "Picarones con miel extra", precio: 15, stock: 25, foto: "webpocket-picarones.png" },
            { descripcion: "Combo familiar", precio: 28, stock: 15, foto: "webpocket-picarones.png" },
            { descripcion: "Caja para evento", precio: 55, stock: 8, foto: "webpocket-picarones.png" },
            { descripcion: "Miel casera", precio: 9, stock: 30, foto: "webpocket-picarones.png" },
          ],
          gallery: [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
            "https://www.youtube.com/watch?v=kXYiU_JCYtU",
            "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
            "https://www.youtube.com/watch?v=9bZkp7q19f0",
          ],
          preguntas: [
            ["¿Delivery?", "Sí, Breña y cercanos."],
            ["¿Eventos?", "Sí, con 24 h de anticipación."],
            ["¿Recién hechos?", "Sí, al momento."],
            ["¿Yape?", "Sí, Yape y efectivo."],
            ["¿Horario?", "Mar–Dom 3 pm – 10 pm."],
            ["¿Sin azúcar?", "Consultar del día."],
            ["¿Combo familiar?", "S/ 28 aprox."],
            ["¿Recojo?", "Sí, en Breña."],
            ["¿Factura?", "Sí, a pedido."],
            ["¿Tiempo delivery?", "30–50 min."],
          ],
        },
        {
          numero_perfil: 6,
          nombre: "Forno Notte",
          negocio: "Forno Notte",
          categoria: "Pizzería artesanal",
          perfil: "Pizzas de masa artesanal preparadas al momento.",
          direccion: "Jesús María, Lima",
          maps: "https://maps.google.com/?q=Jesús+María,+Lima",
          tipo_perfil: "NEGOCIO",
          telefono: "999333444",
          video: VIDEOS[5],
          formatIndex: 16,
          formato_id: "a1000001-0000-4000-8000-000000000017",
          estilo_tarjetas: "carrito_market",
          color_principal: "#E11D48",
          color_secundario: "#FB7185",
          products: [
            { descripcion: "Pizza margarita", precio: 28, stock: 20, foto: "webpocket-pizza.jpg" },
            { descripcion: "Pizza pepperoni", precio: 32, stock: 18, foto: "webpocket-pizza.jpg" },
            { descripcion: "Pizza vegetariana", precio: 30, stock: 12, foto: "webpocket-pizza.jpg" },
            { descripcion: "Combo familiar", precio: 65, stock: 10, foto: "webpocket-pizza.jpg" },
            { descripcion: "Gaseosa personal", precio: 5, stock: 50, foto: "webpocket-pizza.jpg" },
          ],
          gallery: [
            "https://www.youtube.com/watch?v=0QRO3gKj3qw",
            "https://www.youtube.com/watch?v=1s58rW0_jdc",
            "https://www.youtube.com/watch?v=Zi_XLOBDo_Y",
            "https://www.youtube.com/watch?v=hTWKbfoikeg",
            "https://www.youtube.com/watch?v=fLexgOxsZu0",
          ],
          preguntas: [
            ["¿Masa artesanal?", "Sí, fermentación lenta."],
            ["¿Delivery?", "Jesús María y vecinos."],
            ["¿Vegetariana?", "Sí."],
            ["¿Tiempo?", "15–25 min."],
            ["¿Pagos?", "Yape, plin y efectivo."],
            ["¿Mesas?", "Sí, reserva recomendada."],
            ["¿Tamaños?", "Mediana y familiar."],
            ["¿Horario?", "12 pm – 11 pm."],
            ["¿Promos?", "Combo familiar."],
            ["¿Gluten free?", "No por ahora."],
          ],
        },
        {
          numero_perfil: 7,
          nombre: "Torque Andino",
          negocio: "Torque Andino",
          categoria: "Taller automotriz",
          perfil: "Mantenimiento automotriz explicado sin complicaciones.",
          direccion: "Ate, Lima",
          maps: "https://maps.google.com/?q=Ate,+Lima",
          tipo_perfil: "NEGOCIO",
          telefono: "999555666",
          video: VIDEOS[6],
          formatIndex: 14,
          formato_id: "a1000001-0000-4000-8000-000000000015",
          estilo_tarjetas: "carrito_lista",
          color_principal: "#0EA5E9",
          color_secundario: "#38BDF8",
          products: [
            { descripcion: "Cambio de aceite", precio: 80, stock: 30, foto: "webpocket-mecanica.jpg" },
            { descripcion: "Revisión de frenos", precio: 120, stock: 15, foto: "webpocket-mecanica.jpg" },
            { descripcion: "Alineamiento", precio: 70, stock: 20, foto: "webpocket-mecanica.jpg" },
            { descripcion: "Diagnóstico general", precio: 50, stock: 25, foto: "webpocket-mecanica.jpg" },
            { descripcion: "Cambio de batería", precio: 200, stock: 8, foto: "webpocket-mecanica.jpg" },
          ],
          gallery: [
            "https://www.youtube.com/watch?v=5J7qA7vSxjs",
            "https://www.youtube.com/watch?v=0M89zxnZ3c8",
            "https://www.youtube.com/watch?v=2vjPBrBU-TM",
            "https://www.youtube.com/watch?v=e-ORhEE9VVg",
            "https://www.youtube.com/watch?v=YQHsXMglC9A",
          ],
          preguntas: [
            ["¿Todas las marcas?", "Vehículos livianos de la mayoría."],
            ["¿Cita previa?", "Recomendada."],
            ["¿Garantía?", "Sí, según servicio."],
            ["¿Repuestos?", "De calidad a pedido."],
            ["¿Diagnóstico?", "Sí, computarizado."],
            ["¿Horario?", "Lun–Sáb 8 am – 6 pm."],
            ["¿Estacionamiento?", "Sí, limitado."],
            ["¿Factura?", "Sí."],
            ["¿Domicilio?", "Solo grúa; trabajo en taller."],
            ["¿Cambio de aceite?", "30–45 min."],
          ],
        },
        {
          numero_perfil: 8,
          nombre: "Tinta Urbana",
          negocio: "Tinta Urbana",
          categoria: "Polos personalizados",
          perfil: "Diseños personalizados para equipos, emprendimientos y celebraciones.",
          direccion: "Los Olivos, Lima",
          maps: "https://maps.google.com/?q=Los+Olivos,+Lima",
          tipo_perfil: "NEGOCIO",
          telefono: "999777888",
          video: VIDEOS[7],
          formatIndex: 13,
          formato_id: "a1000001-0000-4000-8000-000000000014",
          estilo_tarjetas: "carrito_grilla",
          color_principal: "#22C55E",
          color_secundario: "#86EFAC",
          products: [
            { descripcion: "Polo personalizado básico", precio: 35, stock: 50, foto: "webpocket-polos.jpg" },
            { descripcion: "Polo full color", precio: 48, stock: 30, foto: "webpocket-polos.jpg" },
            { descripcion: "Polo para equipo", precio: 42, stock: 40, foto: "webpocket-polos.jpg" },
            { descripcion: "Polo infantil", precio: 28, stock: 25, foto: "webpocket-polos.jpg" },
            { descripcion: "Diseño adicional", precio: 15, stock: 100, foto: "webpocket-polos.jpg" },
          ],
          gallery: [
            "https://www.youtube.com/watch?v=QChut41O2rY",
            "https://www.youtube.com/watch?v=RgKAFK5djSk",
            "https://www.youtube.com/watch?v=OPf0YbXqDm0",
            "https://www.youtube.com/watch?v=hT_nvWreIhg",
            "https://www.youtube.com/watch?v=CevxZvSJLk8",
          ],
          preguntas: [
            ["¿Mínimo de pedido?", "Desde 1; mejor precio desde 6."],
            ["¿Plazo?", "3–5 días hábiles."],
            ["¿Logo?", "Sí, PNG o vector."],
            ["¿Tallas?", "S, M, L, XL e infantil."],
            ["¿Colores?", "Negro, blanco, azul, rojo y más."],
            ["¿Estampado?", "DTF y serigrafía."],
            ["¿Provincia?", "Sí, por agencia."],
            ["¿Diseño incluido?", "Uno base; extras con costo."],
            ["¿Pagos?", "50% adelanto."],
            ["¿Muestra?", "Mockup antes de producir."],
          ],
        },
      ];
      const qs = new URLSearchParams(location.search),
        qrCode = qs.get("perfil");
      
      if (!window._wpSwipeProdBound) {
        window._wpSwipeProdBound = true;
        document.addEventListener("click", (ev) => {
          const img = ev.target && ev.target.closest && ev.target.closest(".prod-swipe-img, .prod-swipe-card img");
          if (!img) return;
          const card = img.closest("[data-prod-id]");
          if (!card) return;
          const id = card.getAttribute("data-prod-id");
          const pedir = card.querySelector("[data-pedir]");
          const precio = pedir ? pedir.getAttribute("data-precio") : "0";
          const moneda = pedir ? pedir.getAttribute("data-moneda") : "PEN";
          const foto = img.getAttribute("src") || "";
          let ov = document.getElementById("prod-detail-overlay");
          if (ov) ov.remove();
          ov = document.createElement("div");
          ov.id = "prod-detail-overlay";
          ov.className = "prod-detail-overlay";
          ov.innerHTML =
            '<div class="prod-detail-card">' +
            (foto ? '<img src="'+foto+'" style="width:100%;max-height:240px;object-fit:cover;border-radius:12px"/>' : '') +
            '<div style="font-weight:900;font-size:18px;margin:10px 0 4px;color:#fff">'+id+'</div>' +
            '<div style="color:#fbbf24;font-weight:800;margin-bottom:12px">S/ '+Number(precio||0).toFixed(2)+'</div>' +
            '<div style="display:flex;gap:8px">' +
            '<button type="button" class="pd-pedir" style="flex:1;padding:12px;border:0;border-radius:12px;background:#22c55e;color:#052e16;font-weight:900">Pedir</button>' +
            '<button type="button" class="pd-cancel" style="flex:1;padding:12px;border:0;border-radius:12px;background:#334155;color:#fff;font-weight:800">Cancelar</button>' +
            '</div></div>';
          ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
          ov.querySelector(".pd-cancel").onclick = () => ov.remove();
          ov.querySelector(".pd-pedir").onclick = () => {
            if (pedir) pedir.click();
            ov.remove();
            try {
              void appAlert("✓ Agregado al carrito");
            } catch (_) {
              try {
                alert("Agregado al carrito");
              } catch (_) {}
            }
          };
          document.body.appendChild(ov);
        }, true);
      }

