export const formatScore = (value) => {
  const numericValue = Number(value || 0);
  return numericValue > 0 ? `+${numericValue}` : `${numericValue}`;
};

export const formatDate = (value) => {
  if (!value) return 'Just now';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Just now';
  }
};
