import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../types/taskflow';

interface AvatarProps {
  memberId: string;
  size?: 'sm' | 'md';
}

export const Avatar: React.FC<AvatarProps> = ({ memberId, size = 'sm' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const member = TEAM_MEMBERS.find((m) => m.id === memberId) ?? TEAM_MEMBERS[0];
  const dims = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  if (imgFailed || !member.avatarUrl) {
    return (
      <span
        title={`${member.name} · ${member.role}`}
        className={`${dims} ${member.color} rounded-full inline-flex items-center justify-center font-semibold shrink-0 select-none ring-1 ring-black/5`}
      >
        {member.initials}
      </span>
    );
  }

  return (
    <img
      src={member.avatarUrl}
      alt={member.name}
      title={`${member.name} · ${member.role}`}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${dims} rounded-full object-cover shrink-0 ring-1 ring-[#E2E8F0]`}
    />
  );
};
