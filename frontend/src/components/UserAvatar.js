import React, { useState, useEffect, memo } from 'react';
import { Avatar as MUIAvatar, Skeleton } from '@mui/material';

const UserAvatar = memo(({ user, src, alt, size = 40, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(src || user?.avatar);

  useEffect(() => {
    setAvatarSrc(src || user?.avatar);
  }, [src, user?.avatar]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (!avatarSrc) {
    return (
      <MUIAvatar
        {...props}
        sx={{ width: size, height: size, ...props.sx }}
      >
        {alt?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
      </MUIAvatar>
    );
  }

  return (
    <>
      {loading && <Skeleton variant="circular" width={size} height={size} />}
      <MUIAvatar
        src={avatarSrc}
        alt={alt || user?.email}
        {...props}
        sx={{ 
          width: size, 
          height: size, 
          display: loading ? 'none' : 'flex',
          ...props.sx 
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar; 