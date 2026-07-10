// CompositorApp.jsx — punto de entrada del Compositor: alterna entre la lista de Proyectos
// y el canvas de un proyecto abierto. Ambas pantallas ya son overlays de pantalla completa
// (position:fixed, inset:0) — cubren el sidebar de la app sin necesidad de desmontarlo.
import { useState } from "react";
import ProjectsScreen from "./ProjectsScreen.jsx";
import CanvasScreen from "./CanvasScreen.jsx";

export default function CompositorApp({ brand, updateBrand, apiKey, notify, busy, setBusy, onExit }) {
  const [openProjectId, setOpenProjectId] = useState(null);
  const proyecto = openProjectId ? (brand?.proyectos || []).find(p => p.id === openProjectId) : null;

  if (proyecto) {
    return (
      <CanvasScreen
        proyecto={proyecto}
        brand={brand}
        updateBrand={updateBrand}
        apiKey={apiKey}
        notify={notify}
        busy={busy}
        setBusy={setBusy}
        onBack={() => setOpenProjectId(null)}
      />
    );
  }

  return (
    <ProjectsScreen
      brand={brand}
      updateBrand={updateBrand}
      onOpenProject={setOpenProjectId}
      onBack={onExit}
    />
  );
}
