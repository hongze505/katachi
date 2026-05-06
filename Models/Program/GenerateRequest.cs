namespace katachi.Models.Program
{
    public class GenerateRequest
    {
        public string Goal { get; set; }
        public int Days { get; set; }
        public List<string> Equipment { get; set; }
    }
}