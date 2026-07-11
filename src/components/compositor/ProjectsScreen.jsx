// ProjectsScreen.jsx — pantalla "Compositor / Proyectos": buscar, crear carpetas,
// iniciar un proyecto nuevo (desde cero o desde una plantilla) o retomar uno guardado.
// Cada proyecto tiene un menú "⋯" con mover a carpeta / duplicar / crear plantilla / eliminar,
// y también se puede arrastrar directo sobre una carpeta para moverlo.
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, FolderPlus, Plus, Folder as FolderIcon, Trash2, MoreVertical, Copy, BookmarkPlus, ChevronRight, ChevronLeft, LayoutTemplate } from "lucide-react";
import { uid } from "@/lib/utils";
import { T, font, fontDisplay, Btn, ModalShell, Inp } from "./ui.jsx";
import projectIcon from "@/assets/icons/project-icon-cozy-nodes.png";

// Arranca con el Cerebro + un placeholder "Elegir siguiente paso" — el resto del flujo
// (Persona/Receta/Oferta/Prompt/Chat) lo arma el usuario libremente, en el orden que quiera.
export function crearProyectoNuevo(name) {
  const now = new Date().toISOString();
  const cerebroId = uid(), phId = uid();
  const nodes = [
    { id: cerebroId, type: "cerebro", position: { x: 80, y: 220 }, data: { sources: [] } },
    { id: phId, type: "placeholder", position: { x: 500, y: 260 }, data: {} },
  ];
  const edges = [{ id: uid(), source: cerebroId, target: phId }];
  return { id: uid(), name: name || "Proyecto sin título", description: "", folderId: null, nodes, edges, createdAt: now, updatedAt: now };
}

// Clona nodos/edges con ids nuevos — necesario al instanciar una plantilla o al duplicar un
// proyecto, para que las dos copias no compartan ids (React Flow los usa como key).
function clonarFlujo(nodes, edges) {
  const idMap = {};
  const newNodes = nodes.map(n => { const nid = uid(); idMap[n.id] = nid; return { ...n, id: nid, data: { ...n.data } }; });
  const newEdges = edges.map(e => ({ ...e, id: uid(), source: idMap[e.source] || e.source, target: idMap[e.target] || e.target }));
  return { nodes: newNodes, edges: newEdges };
}

function timeAgo(iso) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

function MenuItem({ icon, label, onClick, chevron, danger }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: T.radiusInput, cursor: "pointer", fontSize: 12.5, color: danger ? T.red : T.navy }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? T.redBg : T.purpleBg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {icon} <span style={{ flex: 1 }}>{label}</span> {chevron && <ChevronRight size={12} style={{ color: T.slate }} />}
    </div>
  );
}

function ProjectMenu({ folders, currentFolderId, onMove, onDuplicate, onSaveTemplate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  function close() { setOpen(false); setShowFolders(false); }
  function toggle() {
    if (!open) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(v => !v);
  }
  return (
    <div onClick={e => e.stopPropagation()}>
      <button ref={btnRef} onClick={toggle} title="Más opciones" style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, display: "flex", padding: 6, borderRadius: T.radiusInput }}>
        <MoreVertical size={16} />
      </button>
      {open && coords && createPortal(
        <>
          <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9500 }} />
          <div className="card-pop-in" style={{ position: "fixed", top: coords.top, right: coords.right, width: 210, background: T.surface, border: `1px solid ${T.gray}`, borderRadius: T.radiusCard, boxShadow: T.shadowModal, padding: 6, zIndex: 9501 }}>
            {!showFolders ? (
              <>
                <MenuItem icon={<FolderIcon size={14} />} label="Mover a carpeta" onClick={() => setShowFolders(true)} chevron />
                <MenuItem icon={<Copy size={14} />} label="Duplicar" onClick={() => { onDuplicate(); close(); }} />
                <MenuItem icon={<BookmarkPlus size={14} />} label="Crear plantilla" onClick={() => { onSaveTemplate(); close(); }} />
                <div style={{ height: 1, background: T.borderSoft, margin: "4px 0" }} />
                <MenuItem icon={<Trash2 size={14} />} label="Eliminar" danger onClick={() => { onDelete(); close(); }} />
              </>
            ) : (
              <>
                <MenuItem icon={<ChevronLeft size={14} />} label="Atrás" onClick={() => setShowFolders(false)} />
                <div style={{ height: 1, background: T.borderSoft, margin: "4px 0" }} />
                <MenuItem label={<span style={{ color: !currentFolderId ? T.purple : T.navy, fontWeight: !currentFolderId ? 700 : 400 }}>Sin carpeta</span>} onClick={() => { onMove(null); close(); }} />
                {folders.map(f => (
                  <MenuItem key={f.id} icon={<FolderIcon size={14} />} label={<span style={{ color: currentFolderId === f.id ? T.purple : T.navy, fontWeight: currentFolderId === f.id ? 700 : 400 }}>{f.name}</span>} onClick={() => { onMove(f.id); close(); }} />
                ))}
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function ProjectRow({ p, folders, onOpen, onDelete, onDescChange, onNameChange, onMove, onDuplicate, onSaveTemplate, onDragStart }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.description || "");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(p.name);
  function save() {
    onDescChange(draft.trim());
    setEditing(false);
  }
  function saveName() {
    const trimmed = nameDraft.trim();
    onNameChange(trimmed || p.name);
    setEditingName(false);
  }
  return (
    <div
      className="card-pop-in"
      draggable
      onDragStart={onDragStart}
      onClick={() => !editing && !editingName && onOpen()}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: T.surface, borderRadius: T.radiusCard, border: `1px solid ${T.gray}`, boxShadow: T.shadowCard, cursor: editing || editingName ? "default" : "grab" }}
    >
      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><img src={projectIcon} alt="" style={{ width: 38, height: 38, objectFit: "contain", imageRendering: "pixelated" }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingName ? (
          <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)} onClick={e => e.stopPropagation()} onBlur={saveName} onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
            style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, border: `1px solid ${T.purple}`, borderRadius: T.radiusInput, padding: "3px 8px", fontFamily: font, outline: "none", width: "92%", boxSizing: "border-box", marginBottom: 3 }} />
        ) : (
          <div onClick={e => { e.stopPropagation(); setNameDraft(p.name); setEditingName(true); }} title="Click para renombrar" style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text" }}>{p.name}</div>
        )}
        {editing ? (
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onClick={e => e.stopPropagation()} onBlur={save} onKeyDown={e => e.key === "Enter" && save()} placeholder="Agregá una descripción…" style={{ fontSize: 11.5, color: T.navy, border: `1px solid ${T.purple}`, borderRadius: T.radiusInput, padding: "3px 8px", fontFamily: font, outline: "none", width: "92%", boxSizing: "border-box" }} />
        ) : (
          <div onClick={e => { e.stopPropagation(); setEditing(true); }} title="Click para editar la descripción" style={{ fontSize: 11.5, color: p.description ? T.slate : T.purple, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.description || "+ Agregar descripción"}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.slate, flexShrink: 0, whiteSpace: "nowrap" }}>{timeAgo(p.updatedAt)}</div>
      <ProjectMenu folders={folders} currentFolderId={p.folderId} onMove={onMove} onDuplicate={onDuplicate} onSaveTemplate={onSaveTemplate} onDelete={onDelete} />
    </div>
  );
}

export default function ProjectsScreen({ brand, updateBrand, onOpenProject, onBack }) {
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [savingTemplateFor, setSavingTemplateFor] = useState(null); // proyecto o null
  const [templateName, setTemplateName] = useState("");

  const proyectos = brand?.proyectos || [];
  const folders = brand?.folders || [];
  const templates = brand?.templates || [];
  const filtered = proyectos
    .filter(p => (folderFilter ? p.folderId === folderFilter : true))
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  function abrirNuevoProyecto(nuevo) {
    if (folderFilter) nuevo.folderId = folderFilter;
    updateBrand(b => ({ ...b, proyectos: [...(b.proyectos || []), nuevo] }));
    onOpenProject(nuevo.id);
  }
  function crearDesdeCero() {
    setShowNewProject(false);
    abrirNuevoProyecto(crearProyectoNuevo("Proyecto sin título"));
  }
  function crearDesdePlantilla(t) {
    setShowNewProject(false);
    const { nodes, edges } = clonarFlujo(t.nodes, t.edges);
    const now = new Date().toISOString();
    abrirNuevoProyecto({ id: uid(), name: t.name, description: "", folderId: null, nodes, edges, createdAt: now, updatedAt: now });
  }
  function crearCarpeta() {
    if (!newFolderName.trim()) return;
    const nueva = { id: uid(), name: newFolderName.trim() };
    updateBrand(b => ({ ...b, folders: [...(b.folders || []), nueva] }));
    setShowNewFolder(false); setNewFolderName("");
  }
  function borrarProyecto(id) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    updateBrand(b => ({ ...b, proyectos: (b.proyectos || []).filter(p => p.id !== id) }));
  }
  function cambiarDescripcion(id, description) {
    updateBrand(b => ({ ...b, proyectos: (b.proyectos || []).map(p => p.id === id ? { ...p, description } : p) }));
  }
  function cambiarNombre(id, name) {
    updateBrand(b => ({ ...b, proyectos: (b.proyectos || []).map(p => p.id === id ? { ...p, name } : p) }));
  }
  function moverProyecto(id, folderId) {
    updateBrand(b => ({ ...b, proyectos: (b.proyectos || []).map(p => p.id === id ? { ...p, folderId } : p) }));
  }
  function duplicarProyecto(p) {
    const { nodes, edges } = clonarFlujo(p.nodes, p.edges);
    const now = new Date().toISOString();
    const copia = { ...p, id: uid(), name: `${p.name} (copia)`, nodes, edges, createdAt: now, updatedAt: now };
    updateBrand(b => ({ ...b, proyectos: [...(b.proyectos || []), copia] }));
  }
  function guardarPlantilla() {
    if (!savingTemplateFor || !templateName.trim()) return;
    const nueva = { id: uid(), name: templateName.trim(), nodes: savingTemplateFor.nodes, edges: savingTemplateFor.edges, createdAt: new Date().toISOString() };
    updateBrand(b => ({ ...b, templates: [...(b.templates || []), nueva] }));
    setSavingTemplateFor(null); setTemplateName("");
  }
  function eliminarPlantilla(id, e) {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta plantilla?")) return;
    updateBrand(b => ({ ...b, templates: (b.templates || []).filter(t => t.id !== id) }));
  }

  return (
    <div className="screen-slide-in" style={{ position: "fixed", inset: 0, zIndex: 8000, background: T.canvas, display: "flex", flexDirection: "column", fontFamily: font }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.gray}`, padding: "0 20px", height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} title="Volver" style={{ width: 34, height: 34, borderRadius: T.radiusPill, border: `1px solid ${T.gray}`, background: T.surfaceInset, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.navy }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: fontDisplay }}>
          Compositor <span style={{ color: T.slate, fontWeight: 400 }}>/ Proyectos</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
              <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.slate }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyectos…" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px 10px 36px", fontSize: 13, border: `1.5px solid ${T.gray}`, borderRadius: T.radiusPill, background: T.surface, color: T.navy, fontFamily: font, outline: "none" }} />
            </div>
            <Btn variant="default" onClick={() => setShowNewFolder(true)}><FolderPlus size={14} /> Nueva carpeta</Btn>
            <Btn variant="primary" onClick={() => setShowNewProject(true)}><Plus size={14} /> Nuevo proyecto</Btn>
          </div>

          {folders.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
              <div onClick={() => setFolderFilter(null)} style={{ padding: "6px 13px", borderRadius: T.radiusPill, border: `1.5px solid ${!folderFilter ? T.purple : T.gray}`, background: !folderFilter ? T.purpleBg : T.surface, color: !folderFilter ? T.purple : T.navy, fontSize: 12, fontWeight: !folderFilter ? 700 : 500, cursor: "pointer" }}>Todas</div>
              {folders.map(f => (
                <div key={f.id}
                  onClick={() => setFolderFilter(f.id)}
                  onDragOver={e => { e.preventDefault(); setDragOverFolder(f.id); }}
                  onDragLeave={() => setDragOverFolder(dfid => dfid === f.id ? null : dfid)}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) moverProyecto(id, f.id); setDragOverFolder(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: T.radiusPill, border: `1.5px solid ${dragOverFolder === f.id ? T.purple : folderFilter === f.id ? T.purple : T.gray}`, background: dragOverFolder === f.id ? T.purpleBg : folderFilter === f.id ? T.purpleBg : T.surface, color: folderFilter === f.id || dragOverFolder === f.id ? T.purple : T.navy, fontSize: 12, fontWeight: folderFilter === f.id ? 700 : 500, cursor: "pointer", transition: "all 0.12s" }}>
                  <FolderIcon size={12} /> {f.name}
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div onClick={() => setShowNewProject(true)} style={{ border: `2px dashed ${T.purpleLight}`, borderRadius: T.radiusCard, background: T.purpleBg, padding: "56px 24px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ width: 66, height: 66, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><img src={projectIcon} alt="" style={{ width: 54, height: 54, objectFit: "contain", imageRendering: "pixelated" }} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: fontDisplay, marginBottom: 4 }}>Iniciar nuevo proyecto</div>
              <div style={{ fontSize: 12, color: T.slate }}>{search.trim() ? "Sin proyectos que coincidan con la búsqueda." : "Armá tu flujo libremente: Cerebro, Persona, Receta, Oferta, Prompt y Chat."}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(p => (
                <ProjectRow
                  key={p.id}
                  p={p}
                  folders={folders}
                  onOpen={() => onOpenProject(p.id)}
                  onDelete={() => borrarProyecto(p.id)}
                  onDescChange={desc => cambiarDescripcion(p.id, desc)}
                  onNameChange={name => cambiarNombre(p.id, name)}
                  onMove={folderId => moverProyecto(p.id, folderId)}
                  onDuplicate={() => duplicarProyecto(p)}
                  onSaveTemplate={() => { setSavingTemplateFor(p); setTemplateName(p.name); }}
                  onDragStart={e => e.dataTransfer.setData("text/plain", p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewFolder && (
        <ModalShell title="Nueva carpeta" onClose={() => setShowNewFolder(false)} width={380}>
          <Inp label="Nombre" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="ej. 'Clientes activos'" autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={crearCarpeta} disabled={!newFolderName.trim()}>Crear</Btn>
            <Btn variant="ghost" onClick={() => setShowNewFolder(false)}>Cancelar</Btn>
          </div>
        </ModalShell>
      )}

      {showNewProject && (
        <ModalShell title="Nuevo proyecto" onClose={() => setShowNewProject(false)} width={440}>
          <div onClick={crearDesdeCero} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: T.radiusCard, border: `1.5px solid ${T.purpleLight}`, background: T.purpleBg, cursor: "pointer", marginBottom: templates.length ? 18 : 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Plus size={17} /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Crear desde cero</div>
              <div style={{ fontSize: 11.5, color: T.slate }}>Arrancá con Cerebro y armá tu flujo libremente.</div>
            </div>
          </div>

          {templates.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.slate, marginBottom: 8 }}>O elegí una plantilla</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }} className="nowheel">
                {templates.map(t => (
                  <div key={t.id} onClick={() => crearDesdePlantilla(t)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: T.radiusInput, border: `1px solid ${T.gray}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = T.purpleLight}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.gray}>
                    <LayoutTemplate size={16} color={T.purple} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                    <button onClick={e => eliminarPlantilla(t.id, e)} title="Eliminar plantilla" style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, display: "flex", flexShrink: 0 }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </ModalShell>
      )}

      {savingTemplateFor && (
        <ModalShell title="Crear plantilla" onClose={() => setSavingTemplateFor(null)} width={380}>
          <div style={{ fontSize: 12, color: T.slate, marginBottom: 12 }}>Guarda la estructura de "{savingTemplateFor.name}" para poder arrancar futuros proyectos desde acá.</div>
          <Inp label="Nombre de la plantilla" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="ej. 'Flujo de lanzamiento'" autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={guardarPlantilla} disabled={!templateName.trim()}>Guardar plantilla</Btn>
            <Btn variant="ghost" onClick={() => setSavingTemplateFor(null)}>Cancelar</Btn>
          </div>
        </ModalShell>
      )}
    </div>
  );
}


