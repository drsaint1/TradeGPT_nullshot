import { Box, IconButton, Menu, MenuItem, Typography, ListItemIcon } from '@mui/material';
import { Palette } from 'lucide-react';
import { useState } from 'react';
import { useAppTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectTheme = (selectedTheme: 'dark' | 'light' | 'neon') => {
    setTheme(selectedTheme);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'white',
          bgcolor: 'rgba(255,255,255,0.05)',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        <Palette size={20} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => handleSelectTheme('dark')}
          selected={theme === 'dark'}
          sx={{
            color: 'white',
            '&.Mui-selected': {
              bgcolor: 'rgba(123, 97, 255, 0.2)',
            },
          }}
        >
          <ListItemIcon>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#111213', border: '2px solid #7b61ff' }} />
          </ListItemIcon>
          <Typography>Dark</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectTheme('light')}
          selected={theme === 'light'}
          sx={{
            color: 'white',
            '&.Mui-selected': {
              bgcolor: 'rgba(123, 97, 255, 0.2)',
            },
          }}
        >
          <ListItemIcon>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#ffffff', border: '2px solid #6b51e5' }} />
          </ListItemIcon>
          <Typography>Light</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleSelectTheme('neon')}
          selected={theme === 'neon'}
          sx={{
            color: 'white',
            '&.Mui-selected': {
              bgcolor: 'rgba(123, 97, 255, 0.2)',
            },
          }}
        >
          <ListItemIcon>
            <Box sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#1a0b2e',
              border: '2px solid #ff00ff',
              boxShadow: '0 0 10px #ff00ff',
            }} />
          </ListItemIcon>
          <Typography>Neon</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
