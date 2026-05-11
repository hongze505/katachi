using katachi.Models.Entities;

namespace katachi.Models.Nutrition
{
    public class NutritionService
    {
        public TdeeViewModel CalculateTdee(User user)
        {
            // BMR 用 Mifflin-St Jeor 公式
            double bmr;
            if (user.Gender == "male")
                bmr = 10 * (double)user.WeightKg + 6.25 * (double)user.HeightCm - 5 * user.Age.Value + 5;
            else
                bmr = 10 * (double)user.WeightKg + 6.25 * (double)user.HeightCm - 5 * user.Age.Value - 161;

            // 活動係數
            double factor = user.Activity switch
            {
                "sedentary" => 1.2,
                "light" => 1.375,
                "moderate" => 1.55,
                "active" => 1.725,
                "very_active" => 1.9,
                _ => 1.2
            };

            int tdee = (int)(bmr * factor);

            return new TdeeViewModel
            {
                Name = user.Name,
                Gender = user.Gender,
                Age = user.Age.Value,
                HeightCm = user.HeightCm.Value,
                WeightKg = user.WeightKg.Value,
                Activity = user.Activity,
                Bmr = (int)bmr,
                Tdee = tdee,
                Maintain = tdee,
                Gain = tdee + 300,
                Loss = tdee - 500
            };
        }
    }
}