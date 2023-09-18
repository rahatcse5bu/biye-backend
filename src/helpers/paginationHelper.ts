type IOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
};

type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
};

const calculatePagination = (options: IOptions): IOptionsResult => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || "createdAt";

  return {
    page,
    limit,
    skip,
    sortBy,
  };
};

export const paginationHelpers = {
  calculatePagination,
};
