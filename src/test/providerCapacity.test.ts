import { describe, expect, it } from 'vitest';
import { reserveProviderCapacity } from '../../server/provider-capacity';

describe('instance provider admission', () => {
  it('rejects excess work, admits after release, and tolerates repeated cleanup', () => {
    const first = reserveProviderCapacity('capacity-test', '1');
    expect(first).not.toBeNull();
    expect(reserveProviderCapacity('capacity-test', '1')).toBeNull();
    first!(); first!();
    const second = reserveProviderCapacity('capacity-test', '1');
    expect(second).not.toBeNull();
    expect(reserveProviderCapacity('capacity-test', '1')).toBeNull();
    second!();
  });
  it('isolates providers and permits disabling new provider work with zero', () => {
    const release = reserveProviderCapacity('capacity-a', '1');
    const other = reserveProviderCapacity('capacity-b', '1');
    expect(other).not.toBeNull();
    expect(reserveProviderCapacity('capacity-disabled', '0')).toBeNull();
    release!(); other!();
  });
  it.each(['', '-1', '0.5', 'Infinity', 'invalid'])('uses a finite fallback for %j', value => {
    const release = reserveProviderCapacity(`capacity-${value}`, value, 1);
    expect(release).not.toBeNull();
    expect(reserveProviderCapacity(`capacity-${value}`, value, 1)).toBeNull();
    release!();
  });
});
