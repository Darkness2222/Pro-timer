<button
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setActiveTimerId(timer.id);
                       setCurrentView('admin');
                     }}
                     className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                   >
                     Manage Timer →
                   </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingTimer(timer);
                      setEditForm({
                        name: timer.name,
                        presenter: timer.presenter_name
                      });
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    ✏️ Edit Timer
                  </button>

                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       setDeleteConfirmation(timer);
                     }}
                     className="w-full mt-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2"
                   >
                     🗑️ Delete Timer
                   </button>