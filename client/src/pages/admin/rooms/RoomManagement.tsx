import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Home, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Search, Users } from 'lucide-react';
import { roomService } from '../../../services/room.service';
import type { Room } from '../../../services/room.service';
import { RoleGuard } from '../../../components/common/RoleGuard';

export const RoomManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'CLASSROOM' | 'LAB'>('CLASSROOM');
  const [formCapacity, setFormCapacity] = useState(60);

  // Fetch rooms
  const { data: rooms = [], isLoading: loadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: () => roomService.getAll(),
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    await refetchRooms();
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 2000 - elapsed);
    setTimeout(() => {
      setIsRefreshing(false);
    }, remaining);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<Room, 'id'>) => roomService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-list'] });
      setIsAdding(false);
      resetForm();
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create room');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Room> }) => roomService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-list'] });
      setEditingId(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update room');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-list'] });
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete room');
    }
  });

  const resetForm = () => {
    setFormName('');
    setFormType('CLASSROOM');
    setFormCapacity(60);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
    setEditingId(null);
    setErrorMsg(null);
  };

  const startEditing = (room: Room) => {
    setEditingId(room.id);
    setIsAdding(false);
    setFormName(room.name);
    setFormType(room.type);
    setFormCapacity(room.capacity || 60);
    setErrorMsg(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      setErrorMsg('Please specify a room name/number.');
      return;
    }
    createMutation.mutate({
      name: formName,
      type: formType,
      capacity: Number(formCapacity)
    });
  };

  const handleUpdate = (id: string) => {
    if (!formName) {
      setErrorMsg('Room name cannot be empty.');
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        name: formName,
        type: formType,
        capacity: Number(formCapacity)
      }
    });
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Home className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Room Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Configure lecture halls, specialized laboratories, capacities, and active schedules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <RoleGuard allowedRoles={['ADMIN']}>
            <button
              onClick={startAdding}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all font-['Outfit'] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Room
            </button>
          </RoleGuard>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200/80 dark:border-stone-800">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search rooms by name/number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800 dark:text-stone-100"
          />
        </div>
      </div>

      {/* NEW ROOM FORM PANEL */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-emerald-200 dark:border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> New Room Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Room Name/Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 401, Lab B, Seminar Room"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Room Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-700 dark:text-stone-200"
              >
                <option value="CLASSROOM">Classroom (Lecture Hall)</option>
                <option value="LAB">Laboratory (Practical Workshop)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">Max Student Capacity</label>
              <input
                type="number"
                min={10}
                max={200}
                value={formCapacity}
                onChange={(e) => setFormCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 dark:border-stone-800 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Create Room
            </button>
          </div>
        </form>
      )}

      {/* ROOMS LIST GRID */}
      {loadingRooms ? (
        <div className="py-12 text-center text-stone-500 font-medium">Loading rooms directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400 dark:text-stone-500 text-xs font-semibold">
              No rooms declared in the database.
            </div>
          ) : (
            filteredRooms.map(room => {
              const isEditing = editingId === room.id;
              if (isEditing) {
                return (
                  <div key={room.id} className="rounded-3xl border border-emerald-300 bg-emerald-50/10 p-5 space-y-4 dark:border-stone-800 dark:bg-stone-900">
                    <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider">Edit Room Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Name</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-800 dark:text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Type</label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value as any)}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-700 dark:text-stone-200"
                        >
                          <option value="CLASSROOM">Classroom</option>
                          <option value="LAB">Lab</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-stone-400 block uppercase">Capacity</label>
                        <input
                          type="number"
                          value={formCapacity}
                          onChange={(e) => setFormCapacity(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-lg text-stone-800 dark:text-stone-100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 dark:border-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(room.id)}
                        className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={room.id} className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                        {room.name}
                      </h3>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        room.type === 'LAB' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
                          : 'bg-emerald-50 text-emerald-750 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                      }`}>
                        {room.type}
                      </span>
                    </div>

                    <RoleGuard allowedRoles={['ADMIN']}>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEditing(room)}
                          className="p-1.5 rounded-lg border border-stone-150 hover:bg-stone-50 text-stone-600 dark:border-stone-850 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete Room ${room.name}?`)) {
                              deleteMutation.mutate(room.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-stone-150 hover:bg-stone-50 text-red-600 dark:border-stone-850 dark:text-red-400 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </RoleGuard>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-3 text-xs text-stone-550 dark:text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-stone-400" />
                      <span>Capacity: <strong className="text-stone-800 dark:text-stone-200">{room.capacity || 'Unspecified'}</strong></span>
                    </div>

                    <div className="text-[10px] font-mono font-extrabold text-stone-405 dark:text-stone-500">
                      {room._count?.timetableSlots || 0} active periods
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
