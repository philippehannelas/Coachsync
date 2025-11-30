"""
Seed script to populate the exercise_template table with 100+ standard exercises.
Run this script after creating the database tables to populate the exercise library.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db
from src.models.exercise_template import ExerciseTemplate
from src.main import app

# Exercise data organized by muscle groups
EXERCISES = [
    # CHEST EXERCISES
    {
        'name': 'Barbell Bench Press',
        'muscle_group': 'Chest',
        'category': 'Barbell',
        'equipment': 'Barbell, Bench',
        'default_sets': 4,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '3-1-1-0',
        'instructions': 'Lie flat on bench, grip bar slightly wider than shoulder width. Lower bar to mid-chest with control, then press back up explosively.',
        'tips': 'Keep feet flat on floor, maintain slight arch in lower back. Avoid bouncing bar off chest.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Incline Barbell Bench Press',
        'muscle_group': 'Chest',
        'category': 'Barbell',
        'equipment': 'Barbell, Incline Bench',
        'default_sets': 4,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '3-1-1-0',
        'instructions': 'Set bench to 30-45 degree incline. Grip bar slightly wider than shoulders, lower to upper chest, press back up.',
        'tips': 'Focus on upper chest contraction. Don\'t set incline too steep or shoulders take over.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Dumbbell Bench Press',
        'muscle_group': 'Chest',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 4,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '3-0-1-0',
        'instructions': 'Lie on flat bench with dumbbells at shoulder level. Press dumbbells up until arms are extended, lower with control.',
        'tips': 'Allow greater range of motion than barbell. Keep wrists straight and elbows at 45-degree angle.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Incline Dumbbell Press',
        'muscle_group': 'Chest',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Incline Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '3-0-1-0',
        'instructions': 'Set bench to 30-45 degrees. Press dumbbells from shoulder level to full extension above upper chest.',
        'tips': 'Excellent for upper chest development. Rotate palms slightly inward at top for peak contraction.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Dumbbell Flyes',
        'muscle_group': 'Chest',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '3-1-1-0',
        'instructions': 'Lie on flat bench with dumbbells extended above chest. Lower dumbbells out to sides in wide arc, then squeeze back to starting position.',
        'tips': 'Keep slight bend in elbows throughout. Focus on stretch at bottom and squeeze at top.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Cable Chest Flyes',
        'muscle_group': 'Chest',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand between cable towers, grab handles at shoulder height. Bring hands together in front of chest with slight bend in elbows.',
        'tips': 'Maintain constant tension throughout movement. Step forward for stability.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Push-Ups',
        'muscle_group': 'Chest',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '15-20',
        'default_rest_seconds': 45,
        'default_tempo': '2-0-1-0',
        'instructions': 'Start in plank position, hands slightly wider than shoulders. Lower chest to ground, push back up to starting position.',
        'tips': 'Keep core tight and body in straight line. Don\'t let hips sag or pike up.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Decline Bench Press',
        'muscle_group': 'Chest',
        'category': 'Barbell',
        'equipment': 'Barbell, Decline Bench',
        'default_sets': 3,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '3-1-1-0',
        'instructions': 'Lie on decline bench with feet secured. Lower bar to lower chest, press back up.',
        'tips': 'Targets lower chest. Use spotter for safety. Control the weight carefully.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Chest Press Machine',
        'muscle_group': 'Chest',
        'category': 'Machine',
        'equipment': 'Chest Press Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-0-1-0',
        'instructions': 'Adjust seat height so handles are at mid-chest level. Press handles forward until arms are extended.',
        'tips': 'Great for beginners to learn pressing movement. Keep shoulder blades retracted.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Pec Deck Machine',
        'muscle_group': 'Chest',
        'category': 'Machine',
        'equipment': 'Pec Deck Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit with back against pad, forearms on pads. Bring arms together in front of chest, squeeze, then return to starting position.',
        'tips': 'Excellent isolation exercise. Focus on squeezing chest at peak contraction.',
        'difficulty': 'beginner'
    },
    
    # BACK EXERCISES
    {
        'name': 'Barbell Bent-Over Row',
        'muscle_group': 'Back',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 4,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '2-1-1-0',
        'instructions': 'Bend at hips with back flat, grip bar slightly wider than shoulder width. Pull bar to lower chest, squeeze shoulder blades together.',
        'tips': 'Keep core tight and back flat. Pull with elbows, not biceps. Avoid using momentum.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Deadlift',
        'muscle_group': 'Back',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 4,
        'default_reps': '5-8',
        'default_rest_seconds': 120,
        'default_tempo': '3-0-2-0',
        'instructions': 'Stand with feet hip-width, grip bar outside legs. Keep back flat, drive through heels to stand up with bar.',
        'tips': 'Master form before adding weight. Keep bar close to body. Engage lats throughout.',
        'difficulty': 'advanced'
    },
    {
        'name': 'Pull-Ups',
        'muscle_group': 'Back',
        'category': 'Bodyweight',
        'equipment': 'Pull-Up Bar',
        'default_sets': 3,
        'default_reps': '8-12',
        'default_rest_seconds': 90,
        'default_tempo': '2-0-2-0',
        'instructions': 'Hang from bar with hands slightly wider than shoulders. Pull body up until chin clears bar, lower with control.',
        'tips': 'Lead with chest, not chin. Avoid swinging or kipping. Use assistance if needed.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Lat Pulldown',
        'muscle_group': 'Back',
        'category': 'Machine',
        'equipment': 'Lat Pulldown Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit with thighs secured under pad. Grip bar wider than shoulders, pull down to upper chest while arching back slightly.',
        'tips': 'Focus on pulling with elbows. Don\'t lean back excessively. Squeeze lats at bottom.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Seated Cable Row',
        'muscle_group': 'Back',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit at cable row station, feet on platform. Pull handle to lower abdomen, squeeze shoulder blades together.',
        'tips': 'Keep torso upright and stable. Don\'t rock back and forth. Focus on mid-back contraction.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Dumbbell Row',
        'muscle_group': 'Back',
        'category': 'Dumbbell',
        'equipment': 'Dumbbell, Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Place one knee and hand on bench, other foot on floor. Row dumbbell to hip, keeping elbow close to body.',
        'tips': 'Great for unilateral back development. Avoid rotating torso. Pull with back, not arm.',
        'difficulty': 'beginner'
    },
    {
        'name': 'T-Bar Row',
        'muscle_group': 'Back',
        'category': 'Barbell',
        'equipment': 'T-Bar Row Machine or Barbell',
        'default_sets': 3,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '2-1-1-0',
        'instructions': 'Straddle bar with bent knees and flat back. Pull bar to chest, squeezing shoulder blades together.',
        'tips': 'Excellent for mid-back thickness. Keep chest up and core tight.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Face Pulls',
        'muscle_group': 'Back',
        'category': 'Cable',
        'equipment': 'Cable Machine with Rope',
        'default_sets': 3,
        'default_reps': '15-20',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Set cable at face height with rope attachment. Pull rope toward face, separating hands and squeezing rear delts.',
        'tips': 'Great for rear delts and upper back. Focus on external rotation at end of movement.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Chin-Ups',
        'muscle_group': 'Back',
        'category': 'Bodyweight',
        'equipment': 'Pull-Up Bar',
        'default_sets': 3,
        'default_reps': '8-12',
        'default_rest_seconds': 90,
        'default_tempo': '2-0-2-0',
        'instructions': 'Hang from bar with underhand grip (palms facing you). Pull up until chin clears bar, lower with control.',
        'tips': 'More bicep involvement than pull-ups. Great for building pulling strength.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Hyperextensions',
        'muscle_group': 'Back',
        'category': 'Bodyweight',
        'equipment': 'Hyperextension Bench',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Position yourself on hyperextension bench. Lower torso toward floor, then raise back up using lower back muscles.',
        'tips': 'Excellent for lower back and glutes. Don\'t hyperextend at top. Can add weight when stronger.',
        'difficulty': 'beginner'
    },
    
    # LEG EXERCISES
    {
        'name': 'Barbell Back Squat',
        'muscle_group': 'Legs',
        'category': 'Barbell',
        'equipment': 'Barbell, Squat Rack',
        'default_sets': 4,
        'default_reps': '8-10',
        'default_rest_seconds': 120,
        'default_tempo': '3-0-2-0',
        'instructions': 'Bar on upper back, feet shoulder-width apart. Squat down until thighs parallel to ground, drive back up through heels.',
        'tips': 'King of leg exercises. Keep chest up, knees tracking over toes. Don\'t let knees cave inward.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Front Squat',
        'muscle_group': 'Legs',
        'category': 'Barbell',
        'equipment': 'Barbell, Squat Rack',
        'default_sets': 3,
        'default_reps': '8-10',
        'default_rest_seconds': 120,
        'default_tempo': '3-0-2-0',
        'instructions': 'Bar rests on front of shoulders, elbows high. Squat down keeping torso upright, drive back up.',
        'tips': 'More quad emphasis than back squat. Requires good mobility. Keep elbows high throughout.',
        'difficulty': 'advanced'
    },
    {
        'name': 'Romanian Deadlift',
        'muscle_group': 'Legs',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 90,
        'default_tempo': '3-1-1-0',
        'instructions': 'Hold bar at hip level. Hinge at hips, lowering bar down legs while keeping back flat. Drive hips forward to return.',
        'tips': 'Excellent for hamstrings and glutes. Feel stretch in hamstrings. Keep bar close to legs.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Leg Press',
        'muscle_group': 'Legs',
        'category': 'Machine',
        'equipment': 'Leg Press Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 90,
        'default_tempo': '3-0-2-0',
        'instructions': 'Sit in leg press machine, feet shoulder-width on platform. Lower platform with control, press back up without locking knees.',
        'tips': 'Great for building quad mass. Don\'t let lower back round at bottom. Adjust foot position for emphasis.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Walking Lunges',
        'muscle_group': 'Legs',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '10-12 per leg',
        'default_rest_seconds': 75,
        'default_tempo': '2-0-2-0',
        'instructions': 'Hold dumbbells at sides. Step forward into lunge, back knee nearly touching ground. Push through front heel to step into next lunge.',
        'tips': 'Excellent for functional leg strength. Keep torso upright. Take controlled steps.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Bulgarian Split Squat',
        'muscle_group': 'Legs',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 3,
        'default_reps': '10-12 per leg',
        'default_rest_seconds': 75,
        'default_tempo': '3-0-2-0',
        'instructions': 'Place rear foot on bench behind you, hold dumbbells. Squat down on front leg until rear knee nearly touches ground.',
        'tips': 'Challenging single-leg exercise. Great for quad development and balance. Keep front knee stable.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Leg Curl',
        'muscle_group': 'Legs',
        'category': 'Machine',
        'equipment': 'Leg Curl Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Lie face down on leg curl machine. Curl heels toward glutes, squeeze hamstrings at top, lower with control.',
        'tips': 'Isolates hamstrings. Don\'t lift hips off pad. Control the negative portion.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Leg Extension',
        'muscle_group': 'Legs',
        'category': 'Machine',
        'equipment': 'Leg Extension Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit in leg extension machine, ankles behind pad. Extend legs until straight, squeeze quads, lower with control.',
        'tips': 'Isolates quadriceps. Good for pre-exhaust or finishing exercise. Don\'t use excessive weight.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Goblet Squat',
        'muscle_group': 'Legs',
        'category': 'Dumbbell',
        'equipment': 'Dumbbell',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '3-0-2-0',
        'instructions': 'Hold dumbbell at chest level. Squat down keeping chest up and elbows inside knees. Drive back up through heels.',
        'tips': 'Great for learning squat pattern. Promotes upright torso. Good for mobility.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Calf Raises',
        'muscle_group': 'Legs',
        'category': 'Machine',
        'equipment': 'Calf Raise Machine or Smith Machine',
        'default_sets': 4,
        'default_reps': '15-20',
        'default_rest_seconds': 45,
        'default_tempo': '2-2-1-0',
        'instructions': 'Stand on platform with balls of feet, heels hanging off. Rise up on toes as high as possible, lower with control.',
        'tips': 'Full range of motion is key. Pause at top and bottom. Can do seated or standing variations.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Hack Squat',
        'muscle_group': 'Legs',
        'category': 'Machine',
        'equipment': 'Hack Squat Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 90,
        'default_tempo': '3-0-2-0',
        'instructions': 'Position shoulders under pads, feet on platform. Lower into squat, then drive back up through heels.',
        'tips': 'Great quad builder. Safer than free weight squats for beginners. Adjust foot position for emphasis.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Sumo Deadlift',
        'muscle_group': 'Legs',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 3,
        'default_reps': '6-8',
        'default_rest_seconds': 120,
        'default_tempo': '3-0-2-0',
        'instructions': 'Wide stance with toes pointed out, grip bar between legs. Keep back flat, drive through heels to stand.',
        'tips': 'More quad and glute emphasis than conventional deadlift. Good for those with long legs.',
        'difficulty': 'intermediate'
    },
    
    # SHOULDER EXERCISES
    {
        'name': 'Overhead Press',
        'muscle_group': 'Shoulders',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 4,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '2-0-2-0',
        'instructions': 'Stand with bar at shoulder level. Press bar overhead until arms fully extended, lower with control.',
        'tips': 'King of shoulder exercises. Keep core tight. Don\'t lean back excessively.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Dumbbell Shoulder Press',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '2-0-1-0',
        'instructions': 'Sit on bench with back support, dumbbells at shoulder level. Press dumbbells overhead until arms extended.',
        'tips': 'Allows greater range of motion than barbell. Keep core engaged. Don\'t arch back excessively.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Lateral Raises',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand with dumbbells at sides. Raise arms out to sides until parallel to ground, lower with control.',
        'tips': 'Isolates side delts. Use lighter weight and focus on form. Lead with elbows, not hands.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Front Raises',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand with dumbbells in front of thighs. Raise dumbbells forward to shoulder height, lower with control.',
        'tips': 'Targets front delts. Often get enough stimulation from pressing movements. Use controlled motion.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Rear Delt Flyes',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Bend over at hips or lie face down on incline bench. Raise dumbbells out to sides, squeezing rear delts.',
        'tips': 'Important for balanced shoulder development. Keep slight bend in elbows. Focus on rear delt contraction.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Arnold Press',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells, Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '2-0-2-0',
        'instructions': 'Start with dumbbells at shoulder level, palms facing you. Press up while rotating palms forward, reverse on the way down.',
        'tips': 'Hits all three delt heads. Requires good shoulder mobility. Use lighter weight than standard press.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Upright Row',
        'muscle_group': 'Shoulders',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Hold bar with narrow grip in front of thighs. Pull bar up to chin level, keeping elbows high, lower with control.',
        'tips': 'Targets side delts and traps. Don\'t pull too high if shoulder discomfort occurs. Can use wider grip.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Cable Lateral Raises',
        'muscle_group': 'Shoulders',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand sideways to cable machine, grab handle with far hand. Raise arm out to side to shoulder height.',
        'tips': 'Constant tension throughout movement. Great for side delt isolation. Control the negative.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Shoulder Press Machine',
        'muscle_group': 'Shoulders',
        'category': 'Machine',
        'equipment': 'Shoulder Press Machine',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '2-0-1-0',
        'instructions': 'Sit in machine with back against pad. Press handles overhead until arms extended, lower with control.',
        'tips': 'Good for beginners or when fatigued. Provides stable pressing path. Adjust seat for proper alignment.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Shrugs',
        'muscle_group': 'Shoulders',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-2-1-0',
        'instructions': 'Hold dumbbells at sides. Shrug shoulders straight up toward ears, squeeze traps at top, lower with control.',
        'tips': 'Targets upper traps. Don\'t roll shoulders. Squeeze and hold at top for 1-2 seconds.',
        'difficulty': 'beginner'
    },
    
    # ARM EXERCISES
    {
        'name': 'Barbell Curl',
        'muscle_group': 'Arms',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand with bar at arm\'s length, palms facing forward. Curl bar up to shoulders, squeeze biceps, lower with control.',
        'tips': 'Classic bicep builder. Keep elbows stationary. Don\'t swing or use momentum.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Dumbbell Curl',
        'muscle_group': 'Arms',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand with dumbbells at sides, palms forward. Curl dumbbells up to shoulders, squeeze, lower with control.',
        'tips': 'Can alternate arms or do simultaneously. Keep elbows stable. Focus on bicep contraction.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Hammer Curl',
        'muscle_group': 'Arms',
        'category': 'Dumbbell',
        'equipment': 'Dumbbells',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Hold dumbbells with palms facing each other (neutral grip). Curl up to shoulders, lower with control.',
        'tips': 'Targets brachialis and brachioradialis. Good for overall arm thickness. Keep wrists neutral.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Preacher Curl',
        'muscle_group': 'Arms',
        'category': 'Barbell',
        'equipment': 'Barbell, Preacher Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit at preacher bench with arms over pad. Curl bar up, squeeze biceps at top, lower with control.',
        'tips': 'Isolates biceps by preventing body momentum. Don\'t hyperextend elbows at bottom.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Close-Grip Bench Press',
        'muscle_group': 'Arms',
        'category': 'Barbell',
        'equipment': 'Barbell, Bench',
        'default_sets': 3,
        'default_reps': '8-10',
        'default_rest_seconds': 90,
        'default_tempo': '3-1-1-0',
        'instructions': 'Lie on bench, grip bar with hands shoulder-width apart. Lower to chest, press back up focusing on triceps.',
        'tips': 'Excellent tricep mass builder. Keep elbows tucked. Don\'t grip too narrow or wrists will hurt.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Tricep Dips',
        'muscle_group': 'Arms',
        'category': 'Bodyweight',
        'equipment': 'Dip Bars',
        'default_sets': 3,
        'default_reps': '10-15',
        'default_rest_seconds': 75,
        'default_tempo': '2-0-2-0',
        'instructions': 'Support body on dip bars. Lower body by bending elbows until upper arms parallel to ground, push back up.',
        'tips': 'Great tricep builder. Keep torso upright for tricep emphasis. Lean forward for more chest.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Overhead Tricep Extension',
        'muscle_group': 'Arms',
        'category': 'Dumbbell',
        'equipment': 'Dumbbell',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Hold dumbbell overhead with both hands. Lower behind head by bending elbows, extend back to starting position.',
        'tips': 'Stretches long head of triceps. Keep elbows pointing forward. Control the weight carefully.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Tricep Pushdown',
        'muscle_group': 'Arms',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand at cable machine with rope or bar attachment. Push down until arms fully extended, return with control.',
        'tips': 'Keep elbows stationary at sides. Squeeze triceps at bottom. Don\'t lean forward excessively.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Skull Crushers',
        'muscle_group': 'Arms',
        'category': 'Barbell',
        'equipment': 'Barbell, Bench',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 75,
        'default_tempo': '3-1-1-0',
        'instructions': 'Lie on bench holding bar above chest. Lower bar toward forehead by bending elbows, extend back to start.',
        'tips': 'Excellent tricep isolation. Keep upper arms stationary. Lower to forehead or behind head.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Cable Curl',
        'muscle_group': 'Arms',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand at cable machine with bar attachment at bottom. Curl bar up to shoulders, squeeze biceps, lower with control.',
        'tips': 'Constant tension on biceps. Great for pump. Can use different attachments for variety.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Concentration Curl',
        'muscle_group': 'Arms',
        'category': 'Dumbbell',
        'equipment': 'Dumbbell, Bench',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Sit on bench, brace elbow against inner thigh. Curl dumbbell up, squeeze bicep at top, lower with control.',
        'tips': 'Excellent bicep isolation. Focus on peak contraction. Keep elbow stable against leg.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Reverse Curl',
        'muscle_group': 'Arms',
        'category': 'Barbell',
        'equipment': 'Barbell',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Hold bar with overhand grip (palms down). Curl bar up to shoulders, lower with control.',
        'tips': 'Targets brachioradialis and forearms. Use lighter weight than regular curls. Keep wrists straight.',
        'difficulty': 'beginner'
    },
    
    # CORE EXERCISES
    {
        'name': 'Plank',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '30-60 seconds',
        'default_rest_seconds': 45,
        'default_tempo': 'Hold',
        'instructions': 'Support body on forearms and toes, body in straight line. Hold position while keeping core tight.',
        'tips': 'Fundamental core exercise. Don\'t let hips sag or pike up. Breathe normally.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Crunches',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '15-20',
        'default_rest_seconds': 45,
        'default_tempo': '2-1-1-0',
        'instructions': 'Lie on back with knees bent, hands behind head. Curl upper body up, squeezing abs, lower with control.',
        'tips': 'Focus on contracting abs, not pulling on neck. Exhale as you crunch up.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Russian Twists',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None or Medicine Ball',
        'default_sets': 3,
        'default_reps': '20-30',
        'default_rest_seconds': 45,
        'default_tempo': '1-0-1-0',
        'instructions': 'Sit with knees bent, lean back slightly. Rotate torso side to side, touching ground beside hips.',
        'tips': 'Targets obliques. Keep core tight throughout. Can hold weight for added resistance.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Leg Raises',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Lie on back with legs straight. Raise legs up to 90 degrees, lower with control without touching ground.',
        'tips': 'Targets lower abs. Keep lower back pressed to floor. Bend knees if too difficult.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Hanging Knee Raises',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'Pull-Up Bar',
        'default_sets': 3,
        'default_reps': '12-15',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Hang from pull-up bar. Raise knees toward chest, squeeze abs at top, lower with control.',
        'tips': 'Great for lower abs. Avoid swinging. Progress to straight leg raises when stronger.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Cable Woodchoppers',
        'muscle_group': 'Core',
        'category': 'Cable',
        'equipment': 'Cable Machine',
        'default_sets': 3,
        'default_reps': '12-15 per side',
        'default_rest_seconds': 60,
        'default_tempo': '2-1-1-0',
        'instructions': 'Stand sideways to cable set high. Pull cable down and across body in chopping motion, rotating torso.',
        'tips': 'Excellent for rotational core strength. Keep arms relatively straight. Control the movement.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Ab Wheel Rollout',
        'muscle_group': 'Core',
        'category': 'Other',
        'equipment': 'Ab Wheel',
        'default_sets': 3,
        'default_reps': '8-12',
        'default_rest_seconds': 75,
        'default_tempo': '3-1-2-0',
        'instructions': 'Kneel with ab wheel in hands. Roll forward extending body, then pull back to starting position using core.',
        'tips': 'Advanced core exercise. Start from knees before progressing to standing. Don\'t let lower back sag.',
        'difficulty': 'advanced'
    },
    {
        'name': 'Side Plank',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '30-45 seconds per side',
        'default_rest_seconds': 45,
        'default_tempo': 'Hold',
        'instructions': 'Lie on side, support body on forearm and side of foot. Hold body in straight line.',
        'tips': 'Targets obliques and lateral core stability. Keep hips elevated. Don\'t let body rotate.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Mountain Climbers',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '20-30',
        'default_rest_seconds': 45,
        'default_tempo': '1-0-1-0',
        'instructions': 'Start in push-up position. Alternate bringing knees toward chest in running motion.',
        'tips': 'Dynamic core and cardio exercise. Keep core tight and hips level. Maintain steady pace.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Dead Bug',
        'muscle_group': 'Core',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '10-12 per side',
        'default_rest_seconds': 45,
        'default_tempo': '3-1-2-0',
        'instructions': 'Lie on back with arms extended up and knees bent at 90 degrees. Lower opposite arm and leg, return, repeat other side.',
        'tips': 'Great for core stability and coordination. Keep lower back pressed to floor. Move with control.',
        'difficulty': 'beginner'
    },
    
    # CARDIO EXERCISES
    {
        'name': 'Treadmill Running',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Treadmill',
        'default_sets': 1,
        'default_reps': '20-30 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady',
        'instructions': 'Run or jog on treadmill at moderate to high intensity. Adjust speed and incline as needed.',
        'tips': 'Classic cardio exercise. Start with comfortable pace. Gradually increase intensity over time.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Stationary Bike',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Stationary Bike',
        'default_sets': 1,
        'default_reps': '20-30 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady',
        'instructions': 'Pedal at moderate to high intensity. Adjust resistance to challenge yourself.',
        'tips': 'Low-impact cardio option. Good for active recovery. Can do intervals for higher intensity.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Rowing Machine',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Rowing Machine',
        'default_sets': 1,
        'default_reps': '15-20 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady',
        'instructions': 'Row with proper form: legs, core, then arms on pull. Reverse on return. Maintain steady pace.',
        'tips': 'Full-body cardio workout. Focus on technique. Drive with legs, not just arms.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Jump Rope',
        'muscle_group': 'Cardio',
        'category': 'Bodyweight',
        'equipment': 'Jump Rope',
        'default_sets': 3,
        'default_reps': '2-3 minutes',
        'default_rest_seconds': 60,
        'default_tempo': 'Steady',
        'instructions': 'Jump rope at steady pace, landing softly on balls of feet.',
        'tips': 'Excellent cardio and coordination. Start with shorter intervals. Stay on balls of feet.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Burpees',
        'muscle_group': 'Cardio',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '10-15',
        'default_rest_seconds': 60,
        'default_tempo': '1-0-1-0',
        'instructions': 'Drop to push-up position, do push-up, jump feet to hands, jump up with arms overhead. Repeat.',
        'tips': 'High-intensity full-body exercise. Modify by removing push-up or jump if needed.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Elliptical',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Elliptical Machine',
        'default_sets': 1,
        'default_reps': '20-30 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady',
        'instructions': 'Use elliptical machine at moderate to high intensity. Adjust resistance and incline as needed.',
        'tips': 'Low-impact cardio option. Good for those with joint issues. Use handles for upper body involvement.',
        'difficulty': 'beginner'
    },
    {
        'name': 'Stair Climber',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Stair Climber Machine',
        'default_sets': 1,
        'default_reps': '15-20 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady',
        'instructions': 'Climb stairs at steady pace. Maintain upright posture, don\'t lean heavily on handles.',
        'tips': 'Great for glutes and cardio. Challenging workout. Start with lower speed.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Box Jumps',
        'muscle_group': 'Cardio',
        'category': 'Bodyweight',
        'equipment': 'Plyo Box',
        'default_sets': 3,
        'default_reps': '10-12',
        'default_rest_seconds': 90,
        'default_tempo': 'Explosive',
        'instructions': 'Stand facing box. Jump explosively onto box, land softly. Step down and repeat.',
        'tips': 'Develops explosive power. Start with lower box height. Focus on soft landings.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Battle Ropes',
        'muscle_group': 'Cardio',
        'category': 'Other',
        'equipment': 'Battle Ropes',
        'default_sets': 3,
        'default_reps': '30 seconds',
        'default_rest_seconds': 60,
        'default_tempo': 'Fast',
        'instructions': 'Hold ends of heavy ropes. Create waves by alternating or simultaneously moving arms up and down rapidly.',
        'tips': 'High-intensity cardio and upper body workout. Keep core tight. Maintain steady rhythm.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Sled Push',
        'muscle_group': 'Cardio',
        'category': 'Other',
        'equipment': 'Prowler Sled',
        'default_sets': 4,
        'default_reps': '20-30 meters',
        'default_rest_seconds': 90,
        'default_tempo': 'Fast',
        'instructions': 'Load sled with weight. Push sled forward by driving through legs, keeping torso low and core tight.',
        'tips': 'Excellent for conditioning and leg strength. Start with lighter weight. Drive with legs.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'Assault Bike',
        'muscle_group': 'Cardio',
        'category': 'Machine',
        'equipment': 'Assault Bike',
        'default_sets': 1,
        'default_reps': '10-15 minutes',
        'default_rest_seconds': 0,
        'default_tempo': 'Steady or Intervals',
        'instructions': 'Pedal and push/pull handles simultaneously. Adjust intensity by pedaling faster or slower.',
        'tips': 'Brutal full-body cardio. Great for intervals. The harder you go, the more resistance.',
        'difficulty': 'intermediate'
    },
    {
        'name': 'High Knees',
        'muscle_group': 'Cardio',
        'category': 'Bodyweight',
        'equipment': 'None',
        'default_sets': 3,
        'default_reps': '30-45 seconds',
        'default_rest_seconds': 45,
        'default_tempo': 'Fast',
        'instructions': 'Run in place bringing knees up to hip height with each step. Pump arms for momentum.',
        'tips': 'Great warm-up or cardio finisher. Keep core tight. Land softly on balls of feet.',
        'difficulty': 'beginner'
    },
]

def seed_exercises():
    """Populate the database with exercise templates"""
    with app.app_context():
        # Check if exercises already exist
        existing_count = ExerciseTemplate.query.count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} exercises. Skipping seed.")
            print("   To re-seed, delete existing exercises first.")
            return
        
        print("🌱 Seeding exercise database...")
        
        added_count = 0
        for exercise_data in EXERCISES:
            exercise = ExerciseTemplate(**exercise_data)
            db.session.add(exercise)
            added_count += 1
        
        try:
            db.session.commit()
            print(f"✅ Successfully added {added_count} exercises to the database!")
            
            # Print summary by muscle group
            print("\n📊 Exercise Summary by Muscle Group:")
            muscle_groups = db.session.query(
                ExerciseTemplate.muscle_group,
                db.func.count(ExerciseTemplate.id)
            ).group_by(ExerciseTemplate.muscle_group).all()
            
            for muscle_group, count in muscle_groups:
                print(f"   {muscle_group}: {count} exercises")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error seeding database: {str(e)}")

if __name__ == '__main__':
    seed_exercises()
