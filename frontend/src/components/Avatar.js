import React, { useState } from 'react';
import { Avatar as MUIAvatar, Skeleton } from '@mui/material';

const UserAvatar = ({ src, alt, size = 40, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (loading) {
    return <Skeleton variant="circular" width={size} height={size} />;
  }

  if (error || !src) {
    // Fallback to initials avatar if image fails to load
    return (
      <MUIAvatar
        {...props}
        sx={{ width: size, height: size, ...props.sx }}
      >
        {alt?.charAt(0).toUpperCase()}
      </MUIAvatar>
    );
  }

  return (
    <>
      <MUIAvatar
        src={src}
        alt={alt}
        {...props}
        sx={{ width: size, height: size, ...props.sx }}
        onLoad={handleLoad}
        onError={handleError}
      />
      {/* Hidden image to trigger load/error events */}
      <img
        src={src}
        alt=""
        style={{ display: 'none' }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
};

export default UserAvatar; 