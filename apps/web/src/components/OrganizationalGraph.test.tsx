import { render, screen } from '@testing-library/react';
import { OrganizationalGraph } from './OrganizationalGraph';

describe('OrganizationalGraph', () => {
  it('shows only the organization root when the API returns no organizational records', () => {
    render(
      <OrganizationalGraph
        companyName="Test organization"
        companyStatus="ACTIVE"
        departments={[]}
        agents={[]}
        projects={[]}
        tasks={[]}
        decisions={[]}
      />,
    );

    expect(screen.getByText('Test organization')).toBeInTheDocument();
    expect(screen.queryByText('Autonomous CTO Agent')).not.toBeInTheDocument();
    expect(screen.queryByText('NEXORA Operating System Upgrade')).not.toBeInTheDocument();
    expect(screen.queryByText('Verified Audit Proof')).not.toBeInTheDocument();
  });
});
