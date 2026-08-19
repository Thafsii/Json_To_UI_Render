import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';
import {
  ecommerceFixture,
  complianceFixture,
  securityFixture,
  hrFixture,
  monitoringFixture,
  projectManagementFixture,
  unknownFixture,
} from './fixtures.js';

const renderJson = (json) => {
  render(<App />);
  const editor = document.querySelector('textarea');
  fireEvent.change(editor, { target: { value: JSON.stringify(json, null, 2) } });
  fireEvent.click(screen.getByRole('button', { name: 'Render' }));
};

describe('App end-to-end domain flows (upload/paste -> parse -> detect -> render)', () => {
  it('renders the ecommerce dashboard for ecommerce JSON', () => {
    renderJson(ecommerceFixture);
    expect(screen.getByText('Ecommerce summary')).toBeInTheDocument();
  });

  it('renders the compliance dashboard for compliance JSON', () => {
    renderJson(complianceFixture);
    expect(screen.getByText(/assessment$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SOC 2/).length).toBeGreaterThan(0);
  });

  it('renders the security dashboard for security JSON', () => {
    renderJson(securityFixture);
    expect(screen.getByText('Security dashboard')).toBeInTheDocument();
  });

  it('renders the HR dashboard for hrms JSON', () => {
    renderJson(hrFixture);
    expect(screen.getByText('People operations')).toBeInTheDocument();
  });

  it('renders the monitoring dashboard for monitoring JSON', () => {
    renderJson(monitoringFixture);
    expect(screen.getByText('Observability overview')).toBeInTheDocument();
  });

  it('renders the project management dashboard for project_management JSON', () => {
    renderJson(projectManagementFixture);
    expect(screen.getByText('Delivery dashboard')).toBeInTheDocument();
  });

  it('falls back to the generic explorer for an unrecognized domain', () => {
    renderJson(unknownFixture);
    expect(screen.getByText('Explore your JSON data')).toBeInTheDocument();
  });

  it('shows a JSON error for invalid JSON instead of crashing', () => {
    render(<App />);
    const editor = document.querySelector('textarea');
    fireEvent.change(editor, { target: { value: '{ this is not valid json' } });
    fireEvent.click(screen.getByRole('button', { name: 'Render' }));
    expect(screen.getByText('JSON errors')).toBeInTheDocument();
  });

  it('runs deterministic analysis and enables README generation when Analyze Data is clicked', () => {
    renderJson(ecommerceFixture);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Data' }));
    expect(screen.getAllByText(/products \(\d+\)/i).length).toBeGreaterThan(0);
    const generateButtons = screen.getAllByRole('button', { name: 'Generate README' });
    generateButtons.forEach((button) => expect(button).not.toBeDisabled());
  });

  it('generates a downloadable README after analysis', () => {
    renderJson(complianceFixture);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Data' }));
    const [generateButton] = screen.getAllByRole('button', { name: 'Generate README' });
    fireEvent.click(generateButton);
    expect(screen.getAllByText(/# Overview/).length).toBeGreaterThan(0);
    const downloadButtons = screen.getAllByRole('button', { name: 'Download README.md' });
    downloadButtons.forEach((button) => expect(button).not.toBeDisabled());
  });

  it('allows overriding the detected domain without mutating the underlying JSON', () => {
    renderJson(unknownFixture);
    const select = screen.getByDisplayValue('Change domain… (keep detected)');
    fireEvent.change(select, { target: { value: 'security' } });
    expect(screen.getByText('Security dashboard')).toBeInTheDocument();

    // The raw JSON tab must still show the original, un-mutated document.
    fireEvent.click(screen.getByRole('button', { name: 'Raw JSON' }));
    expect(screen.getByText(/Mystery Inc/)).toBeInTheDocument();
  });
});
