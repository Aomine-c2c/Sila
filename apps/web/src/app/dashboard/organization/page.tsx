'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { controlRoomApi, type ControlRoomState } from '@/lib/api/controlRoom';
import { OrganizationalGraph } from '@/components/OrganizationalGraph';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { PREVIEW_COMPANY } from '@/lib/api/controlRoomPreview';

export default function OrganizationMapPage() {
  const { activeCompany } = useAuthStore();
  const developmentBypass = isDevelopmentAuthBypassEnabled();
  const displayCompany = developmentBypass ? PREVIEW_COMPANY : activeCompany;
  const companyId = displayCompany?.id;

  const { data: state, isLoading } = useQuery<ControlRoomState>({
    queryKey: ['control-room-state', companyId],
    queryFn: () => controlRoomApi.getOperationalState(companyId!),
    enabled: !!companyId,
    staleTime: 15_000,
  });

  if (isLoading || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-mono text-muted-foreground">Rendering Organizational Map…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 max-w-7xl mx-auto">
      <OrganizationalGraph
        companyName={displayCompany!.name}
        companyStatus={displayCompany!.status}
        departments={state.departments}
        agents={state.agents}
        projects={state.projects}
        tasks={state.tasks}
        decisions={state.decisions}
        roles={state.roles}
        audits={state.audits}
      />
    </div>
  );
}
