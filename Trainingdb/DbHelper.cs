using Microsoft.Data.SqlClient;

namespace katachi.Helpers
{
    public class DbHelper
    {
        private readonly string _connStr;

        public DbHelper(IConfiguration config)
        {
            _connStr = config.GetConnectionString("KatachiDb")!;
        }

        public SqlConnection CreateConnection() => new SqlConnection(_connStr);
    }
}