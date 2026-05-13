namespace katachi.Models.Nutrition
{
    public class TdeeViewModel
    {
        // 使用者資料
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Gender { get; set; }
        public int Age { get; set; }
        public decimal HeightCm { get; set; }
        public decimal WeightKg { get; set; }
        public string Activity { get; set; }

        // 計算結果
        public int Bmr { get; set; }
        public int Tdee { get; set; }
        public int Maintain { get; set; }   // TDEE
        public int Gain { get; set; }       // TDEE + 300
        public int Loss { get; set; }       // TDEE - 500
    }
}