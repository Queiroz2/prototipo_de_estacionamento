import { useState, useMemo } from 'react'
import type { Professor, Vehicle, ParkingSpot, Shift } from './types'

const SHIFTS: { key: Shift; label: string; color: string; bg: string; border: string }[] = [
  { key: 'morning', label: 'Manhã', color: '#f59e0b', bg: '#1a110028', border: '#92400e55' },
  { key: 'afternoon', label: 'Tarde', color: '#3b82f6', bg: '#0c1a3a28', border: '#1e3a8a55' },
  { key: 'night', label: 'Noite', color: '#8b5cf6', bg: '#14082a28', border: '#4c1d9555' },
]

const SPOTS_PER_SHIFT = 10

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function initSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = []
  SHIFTS.forEach((shift) => {
    for (let i = 1; i <= SPOTS_PER_SHIFT; i++) {
      spots.push({ id: generateId(), number: i, shift: shift.key, occupied: false })
    }
  })
  return spots
}

const SAMPLE_PROFESSORS: Professor[] = [
  {
    id: 'p1', name: 'Ana Carolina Souza', department: 'Matemática',
    vehicles: [
      { id: 'v1', plate: 'ABC-1234', model: 'Honda Civic', color: 'Prata' },
      { id: 'v2', plate: 'DEF-5678', model: 'Fiat Uno', color: 'Branco' },
    ],
  },
  {
    id: 'p2', name: 'Roberto Mendes', department: 'Física',
    vehicles: [
      { id: 'v3', plate: 'GHI-9012', model: 'Toyota Corolla', color: 'Preto' },
    ],
  },
  {
    id: 'p3', name: 'Fernanda Lima', department: 'Química',
    vehicles: [
      { id: 'v4', plate: 'JKL-3456', model: 'Volkswagen Gol', color: 'Vermelho' },
    ],
  },
]

// Pre-occupy a couple of spots
const INITIAL_SPOTS = initSpots()
INITIAL_SPOTS[0] = { ...INITIAL_SPOTS[0], occupied: true, professorId: 'p1', vehicleId: 'v1' }
INITIAL_SPOTS[12] = { ...INITIAL_SPOTS[12], occupied: true, professorId: 'p2', vehicleId: 'v3' }

export default function App() {
  const [professors, setProfessors] = useState<Professor[]>(SAMPLE_PROFESSORS)
  const [spots, setSpots] = useState<ParkingSpot[]>(INITIAL_SPOTS)
  const [activeTab, setActiveTab] = useState<'spots' | 'professors'>('spots')
  const [occupyModal, setOccupyModal] = useState<{ spotId: string } | null>(null)
  const [registerModal, setRegisterModal] = useState(false)
  const [editProfessor, setEditProfessor] = useState<Professor | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift>('morning')

  // Occupy modal state
  const [selectedProfId, setSelectedProfId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  // Professor form
  const [profForm, setProfForm] = useState({ name: '', department: '' })
  const [vehicleForms, setVehicleForms] = useState([{ plate: '', model: '', color: '' }])

  // Active professor vehicles in use
  const activeProfessorMap = useMemo(() => {
    const map: Record<string, string> = {} // professorId -> vehicleId
    spots.forEach((s) => {
      if (s.occupied && s.professorId && s.vehicleId) {
        map[s.professorId] = s.vehicleId
      }
    })
    return map
  }, [spots])

  const shiftSpots = (shift: Shift) => spots.filter((s) => s.shift === shift)

  function openOccupyModal(spotId: string) {
    setSelectedProfId('')
    setSelectedVehicleId('')
    setOccupyModal({ spotId })
  }

  function occupySpot() {
    if (!occupyModal || !selectedProfId || !selectedVehicleId) return
    setSpots((prev) =>
      prev.map((s) =>
        s.id === occupyModal.spotId
          ? { ...s, occupied: true, professorId: selectedProfId, vehicleId: selectedVehicleId }
          : s
      )
    )
    setOccupyModal(null)
  }

  function freeSpot(spotId: string) {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spotId ? { ...s, occupied: false, professorId: undefined, vehicleId: undefined } : s
      )
    )
  }

  function getProfessor(id?: string) {
    return professors.find((p) => p.id === id)
  }

  function getVehicle(prof: Professor | undefined, vehicleId?: string) {
    return prof?.vehicles.find((v) => v.id === vehicleId)
  }

  function openRegisterModal(prof?: Professor) {
    if (prof) {
      setEditProfessor(prof)
      setProfForm({ name: prof.name, department: prof.department })
      setVehicleForms(prof.vehicles.map((v) => ({ plate: v.plate, model: v.model, color: v.color })))
    } else {
      setEditProfessor(null)
      setProfForm({ name: '', department: '' })
      setVehicleForms([{ plate: '', model: '', color: '' }])
    }
    setRegisterModal(true)
  }

  function saveProfessor() {
    if (!profForm.name.trim()) return
    const vehicles: Vehicle[] = vehicleForms
      .filter((v) => v.plate.trim() && v.model.trim())
      .map((v) => ({ id: generateId(), plate: v.plate.trim(), model: v.model.trim(), color: v.color.trim() }))

    if (editProfessor) {
      setProfessors((prev) =>
        prev.map((p) =>
          p.id === editProfessor.id
            ? { ...p, name: profForm.name.trim(), department: profForm.department.trim(), vehicles }
            : p
        )
      )
    } else {
      setProfessors((prev) => [
        ...prev,
        { id: generateId(), name: profForm.name.trim(), department: profForm.department.trim(), vehicles },
      ])
    }
    setRegisterModal(false)
  }

  function deleteProfessor(id: string) {
    setProfessors((prev) => prev.filter((p) => p.id !== id))
    setSpots((prev) =>
      prev.map((s) => (s.professorId === id ? { ...s, occupied: false, professorId: undefined, vehicleId: undefined } : s))
    )
  }

  const selectedProfessor = professors.find((p) => p.id === selectedProfId)
  const availableVehicles = selectedProfessor?.vehicles.filter(
    (v) => !Object.values(activeProfessorMap).includes(v.id)
  ) ?? []

  const shiftInfo = SHIFTS.find((s) => s.key === selectedShift)!

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 17V7l9 5-9 5z" fill="white" stroke="none" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                EstacionaFácil
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gestão de vagas para docentes</p>
            </div>
          </div>
          <nav className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            {[
              { key: 'spots', label: 'Vagas' },
              { key: 'professors', label: 'Professores' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                style={{
                  background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* VAGAS TAB */}
        {activeTab === 'spots' && (
          <div>
            {/* Shift Selector */}
            <div className="flex gap-3 mb-8">
              {SHIFTS.map((shift) => {
                const occupied = shiftSpots(shift.key).filter((s) => s.occupied).length
                const total = SPOTS_PER_SHIFT
                const active = selectedShift === shift.key
                return (
                  <button
                    key={shift.key}
                    onClick={() => setSelectedShift(shift.key)}
                    className="flex-1 p-4 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: active ? shift.bg : 'var(--surface)',
                      border: `1.5px solid ${active ? shift.color : 'var(--border)'}`,
                      boxShadow: active ? `0 0 0 1px ${shift.color}22` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: shift.color, fontFamily: 'var(--font-sans)' }}>
                        {shift.label}
                      </span>
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: shift.color + '22', color: shift.color }}>
                        {occupied}/{total}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {Array.from({ length: total }).map((_, i) => {
                        const spot = shiftSpots(shift.key)[i]
                        return (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full"
                            style={{ background: spot?.occupied ? shift.color : 'var(--border)' }}
                          />
                        )
                      })}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      {total - occupied} vagas livres
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Spots Grid */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-sans)', color: shiftInfo.color }}>
                Turno da {shiftInfo.label}
              </h2>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {shiftSpots(selectedShift).filter((s) => s.occupied).length} de {SPOTS_PER_SHIFT} vagas ocupadas
              </span>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {shiftSpots(selectedShift).map((spot) => {
                const prof = getProfessor(spot.professorId)
                const vehicle = getVehicle(prof, spot.vehicleId)
                return (
                  <div
                    key={spot.id}
                    className="rounded-xl p-4 transition-all duration-200"
                    style={{
                      background: spot.occupied ? 'var(--occupied-bg, #1c100822)' : 'var(--surface)',
                      border: `1.5px solid ${spot.occupied ? '#92400e88' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{
                            background: spot.occupied ? '#92400e44' : 'var(--surface-2)',
                            color: spot.occupied ? '#f59e0b' : 'var(--text-muted)',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {spot.number.toString().padStart(2, '0')}
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: spot.occupied ? '#92400e33' : '#16a34a22',
                            color: spot.occupied ? '#fbbf24' : '#4ade80',
                          }}
                        >
                          {spot.occupied ? '● Ocupada' : '○ Livre'}
                        </span>
                      </div>
                    </div>

                    {spot.occupied && prof && vehicle ? (
                      <div className="mb-3">
                        <p className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                          {prof.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{prof.department}</p>
                        <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                            <rect x="1" y="6" width="22" height="13" rx="2" />
                            <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                            <circle cx="7" cy="16" r="1.5" fill="currentColor" />
                            <circle cx="17" cy="16" r="1.5" fill="currentColor" />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{vehicle.model} · {vehicle.color}</p>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{vehicle.plate}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 h-14 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-2)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vaga disponível</p>
                      </div>
                    )}

                    <button
                      onClick={() => spot.occupied ? freeSpot(spot.id) : openOccupyModal(spot.id)}
                      className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        background: spot.occupied ? 'transparent' : 'var(--primary)',
                        border: spot.occupied ? '1px solid #92400e88' : 'none',
                        color: spot.occupied ? '#fbbf24' : 'white',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {spot.occupied ? 'Liberar vaga' : 'Ocupar vaga'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PROFESSORES TAB */}
        {activeTab === 'professors' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-sans)' }}>Professores cadastrados</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{professors.length} docentes · {professors.reduce((a, p) => a + p.vehicles.length, 0)} veículos</p>
              </div>
              <button
                onClick={() => openRegisterModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 hover:opacity-90"
                style={{ background: 'var(--primary)', color: 'white', fontFamily: 'var(--font-sans)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Novo professor
              </button>
            </div>

            <div className="grid gap-3">
              {professors.map((prof) => {
                const activeVehicleId = activeProfessorMap[prof.id]
                const activeVehicle = prof.vehicles.find((v) => v.id === activeVehicleId)
                return (
                  <div
                    key={prof.id}
                    className="rounded-xl p-5 transition-all duration-200"
                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: 'var(--primary)', color: 'white', fontFamily: 'var(--font-sans)' }}>
                          {prof.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ fontFamily: 'var(--font-sans)' }}>{prof.name}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{prof.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {activeVehicle && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#92400e33', color: '#fbbf24' }}>
                            ● Em uso: {activeVehicle.plate}
                          </span>
                        )}
                        <button
                          onClick={() => openRegisterModal(prof)}
                          className="p-2 rounded-lg transition-all duration-150 hover:opacity-80"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                          title="Editar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteProfessor(prof.id)}
                          className="p-2 rounded-lg transition-all duration-150 hover:opacity-80"
                          style={{ background: '#3f000022', color: '#f87171' }}
                          title="Excluir"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {prof.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                          style={{
                            background: v.id === activeVehicleId ? '#92400e33' : 'var(--surface-2)',
                            border: `1px solid ${v.id === activeVehicleId ? '#92400e88' : 'var(--border)'}`,
                            color: v.id === activeVehicleId ? '#fbbf24' : 'var(--text-muted)',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="6" width="22" height="13" rx="2" />
                            <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span className="font-mono">{v.plate}</span>
                          <span>·</span>
                          <span>{v.model}</span>
                          <span>·</span>
                          <span>{v.color}</span>
                        </div>
                      ))}
                      {prof.vehicles.length === 0 && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhum veículo cadastrado</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* OCCUPY MODAL */}
      {occupyModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setOccupyModal(null)}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-sans)' }}>Ocupar vaga</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Selecione o professor e o veículo em uso hoje.</p>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                Professor
              </label>
              <select
                value={selectedProfId}
                onChange={(e) => { setSelectedProfId(e.target.value); setSelectedVehicleId('') }}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Selecionar professor...</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id} disabled={!!activeProfessorMap[p.id]}>
                    {p.name} {activeProfessorMap[p.id] ? '(já possui vaga ativa)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedProfId && (
              <div className="mb-5">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  Veículo
                </label>
                {availableVehicles.length === 0 ? (
                  <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: '#92400e22', color: '#fbbf24', border: '1.5px solid #92400e66' }}>
                    Este professor já tem um veículo ativo em outra vaga.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {availableVehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150"
                        style={{
                          background: selectedVehicleId === v.id ? '#1e3a8a44' : 'var(--surface-2)',
                          border: `1.5px solid ${selectedVehicleId === v.id ? 'var(--primary-light)' : 'var(--border)'}`,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          <rect x="1" y="6" width="22" height="13" rx="2" />
                          <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                          <circle cx="7" cy="16" r="1.5" fill="currentColor" />
                          <circle cx="17" cy="16" r="1.5" fill="currentColor" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium">{v.model} · {v.color}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{v.plate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setOccupyModal(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)', fontFamily: 'var(--font-sans)' }}
              >
                Cancelar
              </button>
              <button
                onClick={occupySpot}
                disabled={!selectedProfId || !selectedVehicleId}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  background: selectedProfId && selectedVehicleId ? 'var(--primary)' : 'var(--surface-2)',
                  color: selectedProfId && selectedVehicleId ? 'white' : 'var(--text-muted)',
                  opacity: selectedProfId && selectedVehicleId ? 1 : 0.6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {registerModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setRegisterModal(false)}
        >
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
              {editProfessor ? 'Editar professor' : 'Cadastrar professor'}
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Preencha os dados do docente e seus veículos.</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Nome completo</label>
                <input
                  value={profForm.name}
                  onChange={(e) => setProfForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Maria Silva"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Departamento</label>
                <input
                  value={profForm.department}
                  onChange={(e) => setProfForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="Ex: Biologia"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Veículos</p>
              <button
                onClick={() => setVehicleForms((f) => [...f, { plate: '', model: '', color: '' }])}
                className="text-xs flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: 'var(--primary-light)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Adicionar veículo
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {vehicleForms.map((v, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Veículo {i + 1}</span>
                    {vehicleForms.length > 1 && (
                      <button
                        onClick={() => setVehicleForms((f) => f.filter((_, j) => j !== i))}
                        className="text-xs"
                        style={{ color: '#f87171' }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'plate', label: 'Placa', placeholder: 'ABC-1234' },
                      { key: 'model', label: 'Modelo', placeholder: 'Civic' },
                      { key: 'color', label: 'Cor', placeholder: 'Prata' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
                        <input
                          value={(v as any)[field.key]}
                          onChange={(e) =>
                            setVehicleForms((f) =>
                              f.map((item, j) => j === i ? { ...item, [field.key]: e.target.value } : item)
                            )
                          }
                          placeholder={field.placeholder}
                          className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                          style={{ background: 'var(--background)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRegisterModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1.5px solid var(--border)', fontFamily: 'var(--font-sans)' }}
              >
                Cancelar
              </button>
              <button
                onClick={saveProfessor}
                disabled={!profForm.name.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{
                  background: profForm.name.trim() ? 'var(--primary)' : 'var(--surface-2)',
                  color: profForm.name.trim() ? 'white' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {editProfessor ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
