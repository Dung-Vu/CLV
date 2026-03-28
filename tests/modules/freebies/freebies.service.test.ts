import { beforeEach, describe, expect, it, vi } from 'vitest';

const findManyMock = vi.fn();

vi.mock('@/modules/freebies/freebies.repository', () => ({
  freebiesRepository: {
    findMany: findManyMock,
  },
}));

describe('listFreebies', () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findManyMock.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it('hides analyzed zero-score items by default', async () => {
    const { listFreebies } = await import('@/modules/freebies/freebies.service');

    await listFreebies({ page: 1, pageSize: 20 });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dealsOnly: true,
      }),
    );
  });

  it('preserves explicit filter values while applying the default visibility filter', async () => {
    const { listFreebies } = await import('@/modules/freebies/freebies.service');

    await listFreebies({ status: 'analyzed', search: 'credits', page: 2, pageSize: 10 });

    expect(findManyMock).toHaveBeenCalledWith({
      dealsOnly: true,
      status: 'analyzed',
      search: 'credits',
      page: 2,
      pageSize: 10,
    });
  });

  it('allows callers to explicitly switch to all content mode', async () => {
    const { listFreebies } = await import('@/modules/freebies/freebies.service');

    await listFreebies({ dealsOnly: false, page: 1, pageSize: 20 });

    expect(findManyMock).toHaveBeenCalledWith({ dealsOnly: false, page: 1, pageSize: 20 });
  });
});