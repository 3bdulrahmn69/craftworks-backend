/**
 * Pagination utility functions
 */
export class PaginationHelper {
  /**
   * Parse and validate pagination parameters from request query
   */
  static parseParams(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit as string) || 10)
    );

    return { page, limit };
  }

  /**
   * Calculate pagination metadata
   */
  static calculateMeta(page: number, limit: number, totalItems: number) {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      totalPages,
      totalItems,
      hasNextPage,
      hasPrevPage,
    };
  }

  /**
   * Get paginated results with metadata
   */
  static async paginate<T>(
    model: any,
    filter: any = {},
    page: number = 1,
    limit: number = 10,
    sort: any = {},
    populate?: string | string[] | any
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const skip = (page - 1) * limit;

    let query = model.find(filter).skip(skip).limit(limit);

    if (Object.keys(sort).length > 0) query = query.sort(sort);

    if (populate)
      if (Array.isArray(populate))
        populate.forEach((pop) => {
          query = query.populate(pop);
        });
      else query = query.populate(populate);

    const [data, totalItems] = await Promise.all([
      query.lean(),
      model.countDocuments(filter),
    ]);

    const pagination = PaginationHelper.calculateMeta(page, limit, totalItems);

    return { data, pagination };
  }
}
