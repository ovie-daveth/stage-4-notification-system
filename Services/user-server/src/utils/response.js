const defaultPaginationMeta = {
  total: 0,
  limit: 0,
  page: 0,
  total_pages: 0,
  has_next: false,
  has_previous: false,
};

const buildResponse = ({
  success = true,
  data = null,
  message = '',
  error = null,
  meta = defaultPaginationMeta,
} = {}) => ({
  success,
  data,
  error,
  message,
  meta,
});

const buildPaginationMeta = ({ total, limit, page }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    limit,
    page,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_previous: page > 1,
  };
};

module.exports = {
  buildResponse,
  buildPaginationMeta,
  defaultPaginationMeta,
};

