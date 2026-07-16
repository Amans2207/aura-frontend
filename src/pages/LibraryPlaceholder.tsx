import { motion } from 'framer-motion';

export default function LibraryPlaceholder({ title, description }: { title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{title}</h2>
      
      <div 
        className="glass-panel" 
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          borderRadius: '16px'
        }}
      >
        <div style={{ fontSize: '4rem', opacity: 0.5 }}>🚧</div>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Coming Soon</h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}
