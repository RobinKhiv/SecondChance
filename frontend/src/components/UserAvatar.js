import React, { useState } from 'react';
import { Avatar as MUIAvatar, Skeleton } from '@mui/material';

const UserAvatar = ({ src, alt, size = 40, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Add console logs to debug
  console.log('Avatar src:', src);
  console.log('Avatar loading:', loading);
  console.log('Avatar error:', error);

  const handleLoad = () => {
    console.log('Avatar loaded successfully');
    setLoading(false);
  };

  const handleError = () => {
    console.log('Avatar failed to load');
    setLoading(false);
    setError(true);
  };

  if (!src) {
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
      {loading && <Skeleton variant="circular" width={size} height={size} />}
      <MUIAvatar
        src={src}
        alt={alt}
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
};

export default UserAvatar; 