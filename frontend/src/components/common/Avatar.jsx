function Avatar({ user, size = 'md' }) {
  const dimension = size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} className={`${dimension} rounded-full object-cover`} />;
  }

  return (
    <div className={`${dimension} flex items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white`}>
      {initials || 'LU'}
    </div>
  );
}

export default Avatar;
