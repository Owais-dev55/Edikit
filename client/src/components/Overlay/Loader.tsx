import React from 'react'

const Loader = () => {
  return (
    <>
      <div
        className="w-15 aspect-2/1 text-white dark:text-white"
        style={{
          '--_g':
            'no-repeat radial-gradient(circle closest-side, currentColor 90%, transparent)',
          background: `
            var(--_g) 0% 50%,
            var(--_g) 50% 50%,
            var(--_g) 100% 50%
          `,
          backgroundSize: 'calc(100%/3) 50%',
          animation: 'l3 1s linear infinite',
        } as React.CSSProperties}
      />

      <style>{`
        @keyframes l3 {
          20% { background-position: 0% 0%,   50% 50%, 100% 50%; }
          40% { background-position: 0% 100%, 50% 0%,  100% 50%; }
          60% { background-position: 0% 50%,  50% 100%,100% 0%; }
          80% { background-position: 0% 50%,  50% 50%, 100% 100%; }
        }
      `}</style>
    </>
  )
}

export default Loader
