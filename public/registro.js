// registro.js — registro limpio con campos extra + mensajes claros
(function(){
  const $ = (id) => document.getElementById(id);
  const msg = $("mensaje");
  const form = $("registroForm");
  const btn  = $("btnRegistrar");

  function setMsg(t){ if(msg){ msg.textContent = t || ""; } }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    setMsg("");

    const nombre   = ($("regNombre").value || "").trim();
    const email    = ($("regEmail").value || "").trim().toLowerCase();
    const password = $("regPassword").value;

    const ubicacion = ($("regUbicacion").value || "").trim();
    const telefono  = ($("regTelefono").value || "").trim();
    const whatsapp  = ($("regWhatsapp").value || "").trim();
    const alias     = (($("regAlias").value || "").trim()).replace(/^@+/, "");
    const sobremi   = ($("regSobreMi").value || "").trim();

    if(!nombre || !email || !password){
      setMsg("Completá nombre, email y contraseña.");
      return;
    }
    if(password.length < 6){
      setMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    // ✅ Debe aceptar Términos y Privacidad
    const okAcepto = document.getElementById("regAcepto");
    if (!okAcepto || !okAcepto.checked){
      setMsg("Debés aceptar Términos y Privacidad para crear la cuenta.");
      return;
    }

    btn.disabled = true;

    try{
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, email, password,
          ubicacion, telefono, whatsapp, alias, sobremi,
          acepta: true
        })
      });

      // Manejo por status
      if(res.status === 409){
        setMsg("Ese email ya está registrado. Iniciá sesión o usá otro.");
        return;
      }
      if(res.status === 400){
        let j = {}; try{ j = await res.json(); }catch{}
        setMsg(j.error === "FALTAN_CAMPOS" ? "Completá los campos obligatorios." : "Revisá los datos ingresados.");
        return;
      }
      if(!res.ok){
        setMsg("No pudimos registrarte ahora. Probá nuevamente.");
        return;
      }

      const j = await res.json().catch(()=>({}));
      if(!j.ok){
        setMsg("No pudimos registrarte. Probá de nuevo.");
        return;
      }

      // Registro OK → sesión + redirect
      window.setSesion && window.setSesion(j.usuario.email || email);
      localStorage.setItem("usuarioNombre", j.usuario.nombre || nombre);
      localStorage.setItem("usuarioEmail",  j.usuario.email  || email);
      location.href = "inicio.html";
    }catch(err){
      console.warn("[registro] ", err);
      setMsg("Error de conexión. Intentá nuevamente.");
    }finally{
      btn.disabled = false;
    }
  });
})();
