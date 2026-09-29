/**
 * Saves generated recipes & logs scoped strictly to the active user.
 * Supports both featureTab and featureKey conventions.
 */
export function saveToFeatureHistory(featureTab, title, preview, payload, username = 'guest') {
  try {
    const cleanUser = (username || 'guest').trim().toLowerCase();
    
    const newRecord = {
      id: Date.now().toString(),
      title: title || 'Untitled Session',
      preview: preview || '',
      payload: payload,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    // 1. Primary format: rasoi_history_{user}_{feature}
    const keyPrimary = `rasoi_history_${cleanUser}_${featureTab}`;
    const existingPrimary = JSON.parse(localStorage.getItem(keyPrimary) || '[]');
    const updatedPrimary = [newRecord, ...existingPrimary.filter(i => i.title !== title)].slice(0, 30);
    localStorage.setItem(keyPrimary, JSON.stringify(updatedPrimary));

    // 2. Compatibility format: rasoi_history_{feature}_{user}
    const keySecondary = `rasoi_history_${featureTab}_${cleanUser}`;
    localStorage.setItem(keySecondary, JSON.stringify(updatedPrimary));
  } catch (e) {
    console.error('Failed to save to history:', e);
  }
}

/**
 * Retrieves history scoped only to the specified user.
 */
export function getFeatureHistory(featureTab, username = 'guest') {
  try {
    const cleanUser = (username || 'guest').trim().toLowerCase();
    const keyPrimary = `rasoi_history_${cleanUser}_${featureTab}`;
    const keySecondary = `rasoi_history_${featureTab}_${cleanUser}`;
    
    const saved = localStorage.getItem(keyPrimary) || localStorage.getItem(keySecondary);
    return JSON.parse(saved || '[]');
  } catch (e) {
    console.error('Failed to get history:', e);
    return [];
  }
}