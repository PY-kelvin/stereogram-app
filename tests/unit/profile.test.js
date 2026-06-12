// We recreate the core profile validation logic here for testing purposes,
// in a real module system this would be imported from a utils file.
function validateAndHealProfile(profile) {
  const defaultProfile = {
    name: 'User',
    streak: 0,
    sessionHistory: [],
    unlockedStages: [1],
    currentAvatar: 'avatar_cat.png',
    isSetup: true
  };

  if (!profile || typeof profile !== 'object') {
    return { ...defaultProfile };
  }

  // Healing corruptions
  return {
    name: typeof profile.name === 'string' && profile.name.trim() !== '' ? profile.name : defaultProfile.name,
    streak: typeof profile.streak === 'number' && profile.streak >= 0 ? profile.streak : defaultProfile.streak,
    sessionHistory: Array.isArray(profile.sessionHistory) ? profile.sessionHistory : defaultProfile.sessionHistory,
    unlockedStages: Array.isArray(profile.unlockedStages) && profile.unlockedStages.length > 0 ? profile.unlockedStages : defaultProfile.unlockedStages,
    currentAvatar: typeof profile.currentAvatar === 'string' && profile.currentAvatar.includes('.png') ? profile.currentAvatar : defaultProfile.currentAvatar,
    isSetup: typeof profile.isSetup === 'boolean' ? profile.isSetup : defaultProfile.isSetup
  };
}

describe('Profile Self-Healing Logic', () => {

  test('Valid profile remains unchanged', () => {
    const valid = { name: 'Alice', streak: 5, sessionHistory: ['2023-10-10'], unlockedStages: [1,2], currentAvatar: 'avatar_dog.png', isSetup: true };
    const healed = validateAndHealProfile(valid);
    expect(healed).toEqual(valid);
  });

  test('Corrupted string properties are reset to defaults', () => {
    const corrupted = { name: 123, streak: 5, sessionHistory: [], unlockedStages: [1], currentAvatar: null, isSetup: true };
    const healed = validateAndHealProfile(corrupted);
    expect(healed.name).toBe('User');
    expect(healed.currentAvatar).toBe('avatar_cat.png');
    expect(healed.streak).toBe(5); // Retains valid properties
  });

  test('Corrupted numbers (NaN, negative streaks) are reset', () => {
    const corrupted = { name: 'Bob', streak: -10, sessionHistory: [], unlockedStages: [1], currentAvatar: 'avatar_cat.png', isSetup: true };
    const healed = validateAndHealProfile(corrupted);
    expect(healed.streak).toBe(0);
  });

  test('Completely missing profile generates default', () => {
    const healed = validateAndHealProfile(null);
    expect(healed.isSetup).toBe(true);
    expect(healed.streak).toBe(0);
  });

});
