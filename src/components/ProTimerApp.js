const deleteTimer = async (timerId) => {
  try {
    const { error } = await supabase
      .from('timers')
      .delete()
      .eq('id', timerId);

    if (error) {
      console.error('Error deleting timer:', error);
      alert('Failed to delete timer. Please try again.');
      return;
    }

    // If we deleted the active timer, clear the active timer
    if (activeTimerId === timerId) {
      setActiveTimerId(null);
    }

    // Reload timers to update the UI
    loadTimers();
    
    // Close confirmation dialog
    setDeleteConfirmation(null);
  } catch (err) {
    console.error('Failed to delete timer:', err);
    alert('Failed to delete timer. Please try again.');
    setDeleteConfirmation(null);
  }
};

const editTimer = async (timerId, newName, newPresenter) => {
  try {
    const { error } = await supabase
      .from('timers')
      .update({
        name: newName,
        presenter_name: newPresenter
      })
      .eq('id', timerId);

    if (error) {
      console.error('Error updating timer:', error);
      alert('Failed to update timer. Please try again.');
      return;
    }

    // Reload timers to update the UI
    loadTimers();
    
    // Close edit dialog
    setEditingTimer(null);
    setEditForm({ name: '', presenter: '' });
  } catch (err) {
    console.error('Failed to update timer:', err);
    alert('Failed to update timer. Please try again.');
    setEditingTimer(null);
  }
};

const formatTime = (seconds) => {