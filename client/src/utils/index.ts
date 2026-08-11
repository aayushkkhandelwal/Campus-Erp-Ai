export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    GRADUATED: 'blue',
    SUSPENDED: 'red',
    ON_LEAVE: 'yellow',
  };
  return colors[status] || 'gray';
};

export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    ADMIN: 'red',
    FACULTY: 'blue',
    STUDENT: 'green',
  };
  return colors[role] || 'gray';
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

