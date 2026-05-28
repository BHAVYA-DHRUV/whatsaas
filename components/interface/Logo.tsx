// 'use client'

// import Image from 'next/image'
// import { useBranding } from '@/providers/branding-provider'

// export default function Logo() {
//   const { branding } = useBranding()

//   return (
//     <div>
//       {branding?.logoUrl ? (
//         <Image
//           src={branding.logoUrl}
//           alt={branding.name ?? 'Logo'}
//           width={120}
//           height={40}
//           className="object-contain"
//         />
//       ) : (
//         <span className="text-xl font-bold">{branding?.name ?? 'WhatsSaaS'}</span>
//       )}
//     </div>
//   )
// }

'use client'

import Image from 'next/image'
import { useBranding } from '@/providers/branding-provider'

// 1. Define the props structure
interface LogoProps {
  showName?: boolean;
}

// 2. Accept the prop with a default value of true
export default function Logo({ showName = true }: LogoProps) {
  const { branding } = useBranding()

  return (
    <div className="flex items-center">
      {branding?.logoUrl ? (
        <Image
          src={branding.logoUrl}
          alt={branding.name ?? 'Logo'}
          width={120}
          height={40}
          className="object-contain"
        />
      ) : (
        /* 3. Wrap the text in a conditional statement check */
        showName ? (
          <span className="text-xl font-bold">{branding?.name ?? 'WhatsSaaS'}</span>
        ) : (
          /* Fallback visual indicator when the text name is hidden inside the icon box */
          <span className="text-xl font-black tracking-tighter text-primary">
            {(branding?.name ?? 'WhatsSaaS').charAt(0)}
          </span>
        )
      )}
    </div>
  )
}
