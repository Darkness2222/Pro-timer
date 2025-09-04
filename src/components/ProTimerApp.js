{/* Delete Confirmation Modal */}
       {deleteConfirmation && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
             <div className="text-center">
               <div className="text-6xl mb-4">🗑️</div>
               <h3 className="text-xl font-bold text-white mb-2">Delete Timer</h3>
               <p className="text-white/80 mb-2">
                 Are you sure you want to delete <strong>"{deleteConfirmation.name}"</strong>?
               </p>
               <p className="text-red-300 text-sm mb-6">
                 This action cannot be undone and will remove all associated data.
               </p>
               
               <div className="flex gap-3">
                 <button
                   onClick={() => setDeleteConfirmation(null)}
                   className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => deleteTimer(deleteConfirmation.id)}
                   className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                 >
                   Delete Timer
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Edit Timer Modal */}
      {editingTimer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-xl font-bold text-white mb-2">Edit Timer</h3>
              <p className="text-white/80">Update the timer details</p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editForm.name.trim() && editForm.presenter.trim()) {
                editTimer(editingTimer.id, editForm.name.trim(), editForm.presenter.trim());
              }
            }} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Event/Session Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Keynote Presentation"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Presenter Name</label>
                <input
                  type="text"
                  value={editForm.presenter}
                  onChange={(e) => setEditForm({...editForm, presenter: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTimer(null);
                    setEditForm({ name: '', presenter: '' });
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}