-- Seed data: GED practice tests (one per subject)
-- This file runs after migrations via `npx supabase db reset`

-- Create an admin user profile for seed data (uses a fixed UUID)
-- Note: This won't create an auth user — you need to sign up via the app.
-- The tests below use created_by = NULL since there's no auth user yet.

-- ============================================================
-- GED Mathematical Reasoning Practice Test
-- ============================================================
INSERT INTO public.tests (id, title, description, subject, time_limit_minutes, is_public)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'GED Mathematical Reasoning Practice Test 1',
  'Practice test covering arithmetic, algebra, geometry, and data analysis for the GED Math exam.',
  'GED Math',
  115,
  true
);

INSERT INTO public.sections (id, test_id, title, description, sort_order) VALUES
  ('a1111111-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Arithmetic & Number Sense', 'Basic operations, fractions, decimals, and percentages', 0),
  ('a1111111-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'Algebra', 'Expressions, equations, and inequalities', 1),
  ('a1111111-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'Geometry', 'Area, perimeter, volume, and coordinate geometry', 2);

-- Arithmetic questions
INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b1111111-0001-0001-0001-000000000001', 'a1111111-0001-0001-0001-000000000001', 'multiple_choice', 'What is 3/4 + 2/3?', 'Find a common denominator (12): 9/12 + 8/12 = 17/12 = 1 5/12', 1, 0, NULL),
  ('b1111111-0001-0001-0001-000000000002', 'a1111111-0001-0001-0001-000000000001', 'multiple_choice', 'A shirt originally costs $40 and is on sale for 25% off. What is the sale price?', '25% of $40 = $10. Sale price = $40 - $10 = $30.', 1, 1, NULL),
  ('b1111111-0001-0001-0001-000000000003', 'a1111111-0001-0001-0001-000000000001', 'short_answer', 'What is 15% of 200?', '15% × 200 = 0.15 × 200 = 30', 1, 2, ARRAY['30']),
  ('b1111111-0001-0001-0001-000000000004', 'a1111111-0001-0001-0001-000000000001', 'true_false', 'The number 0.75 is equivalent to 3/4.', '0.75 = 75/100 = 3/4', 1, 3, NULL);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b1111111-0001-0001-0001-000000000001', '5/7', false, 0),
  ('b1111111-0001-0001-0001-000000000001', '1 5/12', true, 1),
  ('b1111111-0001-0001-0001-000000000001', '5/12', false, 2),
  ('b1111111-0001-0001-0001-000000000001', '1 1/7', false, 3),
  ('b1111111-0001-0001-0001-000000000002', '$30', true, 0),
  ('b1111111-0001-0001-0001-000000000002', '$35', false, 1),
  ('b1111111-0001-0001-0001-000000000002', '$25', false, 2),
  ('b1111111-0001-0001-0001-000000000002', '$10', false, 3),
  ('b1111111-0001-0001-0001-000000000004', 'True', true, 0),
  ('b1111111-0001-0001-0001-000000000004', 'False', false, 1);

-- Algebra questions
INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b1111111-0001-0001-0001-000000000005', 'a1111111-0001-0001-0001-000000000002', 'multiple_choice', 'Solve for x: 2x + 5 = 17', 'Subtract 5 from both sides: 2x = 12. Divide by 2: x = 6.', 1, 0, NULL),
  ('b1111111-0001-0001-0001-000000000006', 'a1111111-0001-0001-0001-000000000002', 'short_answer', 'Simplify: 3(x + 4) - 2x', '3x + 12 - 2x = x + 12', 1, 1, ARRAY['x + 12', 'x+12']),
  ('b1111111-0001-0001-0001-000000000007', 'a1111111-0001-0001-0001-000000000002', 'multiple_choice', 'Which expression is equivalent to 2(3x - 1) + 4?', '6x - 2 + 4 = 6x + 2', 1, 2, NULL);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b1111111-0001-0001-0001-000000000005', 'x = 6', true, 0),
  ('b1111111-0001-0001-0001-000000000005', 'x = 11', false, 1),
  ('b1111111-0001-0001-0001-000000000005', 'x = 7', false, 2),
  ('b1111111-0001-0001-0001-000000000005', 'x = 22', false, 3),
  ('b1111111-0001-0001-0001-000000000007', '6x + 2', true, 0),
  ('b1111111-0001-0001-0001-000000000007', '6x - 2', false, 1),
  ('b1111111-0001-0001-0001-000000000007', '6x + 4', false, 2),
  ('b1111111-0001-0001-0001-000000000007', '5x + 3', false, 3);

-- Geometry questions
INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b1111111-0001-0001-0001-000000000008', 'a1111111-0001-0001-0001-000000000003', 'multiple_choice', 'What is the area of a rectangle with length 8 cm and width 5 cm?', 'Area = length × width = 8 × 5 = 40 cm²', 1, 0, NULL),
  ('b1111111-0001-0001-0001-000000000009', 'a1111111-0001-0001-0001-000000000003', 'short_answer', 'What is the perimeter of a square with side length 7 inches?', 'Perimeter = 4 × side = 4 × 7 = 28 inches', 1, 1, ARRAY['28', '28 inches', '28 in']),
  ('b1111111-0001-0001-0001-000000000010', 'a1111111-0001-0001-0001-000000000003', 'true_false', 'The sum of angles in a triangle is 180 degrees.', 'This is a fundamental property of Euclidean geometry.', 1, 2, NULL);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b1111111-0001-0001-0001-000000000008', '40 cm²', true, 0),
  ('b1111111-0001-0001-0001-000000000008', '26 cm²', false, 1),
  ('b1111111-0001-0001-0001-000000000008', '13 cm²', false, 2),
  ('b1111111-0001-0001-0001-000000000008', '80 cm²', false, 3),
  ('b1111111-0001-0001-0001-000000000010', 'True', true, 0),
  ('b1111111-0001-0001-0001-000000000010', 'False', false, 1);


-- ============================================================
-- GED Reasoning Through Language Arts Practice Test
-- ============================================================
INSERT INTO public.tests (id, title, description, subject, time_limit_minutes, is_public)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'GED Language Arts Practice Test 1',
  'Practice test covering reading comprehension, grammar, and extended response for the GED RLA exam.',
  'GED Language Arts',
  150,
  true
);

INSERT INTO public.sections (id, test_id, title, description, sort_order) VALUES
  ('a2222222-0001-0001-0001-000000000001', '22222222-2222-2222-2222-222222222222', 'Reading Comprehension', 'Analyze written passages and answer questions', 0),
  ('a2222222-0001-0001-0001-000000000002', '22222222-2222-2222-2222-222222222222', 'Grammar & Language', 'Identify correct grammar, usage, and mechanics', 1),
  ('a2222222-0001-0001-0001-000000000003', '22222222-2222-2222-2222-222222222222', 'Extended Response', 'Write an essay analyzing a given topic', 2);

INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b2222222-0001-0001-0001-000000000001', 'a2222222-0001-0001-0001-000000000001', 'multiple_choice', 'Read the following sentence: "The scientist, who had spent decades studying climate patterns, published her findings last month." What is the function of the clause set off by commas?', 'The clause "who had spent decades studying climate patterns" is a non-essential (nonrestrictive) clause providing additional information about the scientist.', 1, 0, NULL),
  ('b2222222-0001-0001-0001-000000000002', 'a2222222-0001-0001-0001-000000000001', 'multiple_choice', 'Which of the following best describes the purpose of a thesis statement?', 'A thesis statement presents the main argument or claim of an essay.', 1, 1, NULL),
  ('b2222222-0001-0001-0001-000000000003', 'a2222222-0001-0001-0001-000000000001', 'true_false', 'An inference is a conclusion drawn from evidence and reasoning rather than from explicit statements.', 'By definition, an inference requires the reader to go beyond what is directly stated.', 1, 2, NULL);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b2222222-0001-0001-0001-000000000001', 'It provides non-essential information about the scientist', true, 0),
  ('b2222222-0001-0001-0001-000000000001', 'It is the main clause of the sentence', false, 1),
  ('b2222222-0001-0001-0001-000000000001', 'It identifies when the findings were published', false, 2),
  ('b2222222-0001-0001-0001-000000000001', 'It is a dependent clause that cannot be removed', false, 3),
  ('b2222222-0001-0001-0001-000000000002', 'To present the main argument of an essay', true, 0),
  ('b2222222-0001-0001-0001-000000000002', 'To provide background information on a topic', false, 1),
  ('b2222222-0001-0001-0001-000000000002', 'To summarize the conclusion', false, 2),
  ('b2222222-0001-0001-0001-000000000002', 'To list supporting evidence', false, 3),
  ('b2222222-0001-0001-0001-000000000003', 'True', true, 0),
  ('b2222222-0001-0001-0001-000000000003', 'False', false, 1);

-- Grammar questions
INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b2222222-0001-0001-0001-000000000004', 'a2222222-0001-0001-0001-000000000002', 'multiple_choice', 'Choose the sentence with correct subject-verb agreement: ', 'The subject "each" is singular and requires the singular verb "has."', 1, 0, NULL),
  ('b2222222-0001-0001-0001-000000000005', 'a2222222-0001-0001-0001-000000000002', 'multiple_choice', 'Which sentence correctly uses a semicolon?', 'A semicolon connects two independent clauses that are closely related.', 1, 1, NULL),
  ('b2222222-0001-0001-0001-000000000006', 'a2222222-0001-0001-0001-000000000002', 'short_answer', 'Correct the error in this sentence: "Their going to the store later."', 'The correct word is "They''re" (they are), not "Their" (possessive).', 1, 2, ARRAY['They''re going to the store later.', 'They''re going to the store later']);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b2222222-0001-0001-0001-000000000004', 'Each of the students has completed the assignment.', true, 0),
  ('b2222222-0001-0001-0001-000000000004', 'Each of the students have completed the assignment.', false, 1),
  ('b2222222-0001-0001-0001-000000000004', 'Each of the students were completing the assignment.', false, 2),
  ('b2222222-0001-0001-0001-000000000004', 'Each of the students are completing the assignment.', false, 3),
  ('b2222222-0001-0001-0001-000000000005', 'I enjoy reading; it helps me relax after work.', true, 0),
  ('b2222222-0001-0001-0001-000000000005', 'I enjoy reading; and it helps me relax.', false, 1),
  ('b2222222-0001-0001-0001-000000000005', 'I enjoy; reading it helps me relax.', false, 2),
  ('b2222222-0001-0001-0001-000000000005', 'I enjoy reading; because it helps me relax.', false, 3);

-- Essay question
INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order) VALUES
  ('b2222222-0001-0001-0001-000000000007', 'a2222222-0001-0001-0001-000000000003', 'essay', 'Write a well-organized essay (4-6 paragraphs) analyzing the importance of critical thinking skills in everyday life. Include specific examples and clearly state your thesis.', 'This is a manually graded question. Look for a clear thesis, organized paragraphs, specific examples, and proper grammar.', 5, 0);


-- ============================================================
-- GED Science Practice Test
-- ============================================================
INSERT INTO public.tests (id, title, description, subject, time_limit_minutes, is_public)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'GED Science Practice Test 1',
  'Practice test covering life science, physical science, and Earth/space science for the GED Science exam.',
  'GED Science',
  90,
  true
);

INSERT INTO public.sections (id, test_id, title, description, sort_order) VALUES
  ('a3333333-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', 'Life Science', 'Biology, ecology, and human body systems', 0),
  ('a3333333-0001-0001-0001-000000000002', '33333333-3333-3333-3333-333333333333', 'Physical Science', 'Chemistry and physics concepts', 1),
  ('a3333333-0001-0001-0001-000000000003', '33333333-3333-3333-3333-333333333333', 'Earth & Space Science', 'Geology, weather, and astronomy', 2);

INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b3333333-0001-0001-0001-000000000001', 'a3333333-0001-0001-0001-000000000001', 'multiple_choice', 'Which organelle is responsible for producing energy (ATP) in a cell?', 'Mitochondria are known as the "powerhouses" of the cell because they produce ATP through cellular respiration.', 1, 0, NULL),
  ('b3333333-0001-0001-0001-000000000002', 'a3333333-0001-0001-0001-000000000001', 'true_false', 'DNA contains the genetic instructions for the development and functioning of all living organisms.', 'DNA (deoxyribonucleic acid) is the hereditary material in almost all organisms.', 1, 1, NULL),
  ('b3333333-0001-0001-0001-000000000003', 'a3333333-0001-0001-0001-000000000001', 'multiple_choice', 'What is the process by which plants convert sunlight into chemical energy?', 'Photosynthesis is the process where plants use sunlight, water, and CO₂ to produce glucose and oxygen.', 1, 2, NULL),
  ('b3333333-0001-0001-0001-000000000004', 'a3333333-0001-0001-0001-000000000002', 'multiple_choice', 'What is the chemical formula for water?', 'Water is composed of two hydrogen atoms and one oxygen atom: H₂O.', 1, 0, NULL),
  ('b3333333-0001-0001-0001-000000000005', 'a3333333-0001-0001-0001-000000000002', 'short_answer', 'What is Newton''s First Law of Motion also known as?', 'Newton''s First Law is commonly called the Law of Inertia.', 1, 1, ARRAY['Law of Inertia', 'the Law of Inertia', 'law of inertia', 'inertia']),
  ('b3333333-0001-0001-0001-000000000006', 'a3333333-0001-0001-0001-000000000002', 'true_false', 'An atom is the smallest unit of matter that retains the properties of an element.', 'By definition, atoms are the basic building blocks of matter and the smallest unit of an element.', 1, 2, NULL),
  ('b3333333-0001-0001-0001-000000000007', 'a3333333-0001-0001-0001-000000000003', 'multiple_choice', 'Which layer of the Earth is composed of solid iron and nickel?', 'The inner core is a solid sphere of iron and nickel at the center of the Earth.', 1, 0, NULL),
  ('b3333333-0001-0001-0001-000000000008', 'a3333333-0001-0001-0001-000000000003', 'short_answer', 'What scale is used to measure the magnitude of earthquakes?', 'The Richter scale (or moment magnitude scale) measures earthquake magnitude.', 1, 1, ARRAY['Richter scale', 'Richter', 'richter scale', 'richter', 'moment magnitude scale']);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b3333333-0001-0001-0001-000000000001', 'Mitochondria', true, 0),
  ('b3333333-0001-0001-0001-000000000001', 'Ribosome', false, 1),
  ('b3333333-0001-0001-0001-000000000001', 'Nucleus', false, 2),
  ('b3333333-0001-0001-0001-000000000001', 'Golgi apparatus', false, 3),
  ('b3333333-0001-0001-0001-000000000002', 'True', true, 0),
  ('b3333333-0001-0001-0001-000000000002', 'False', false, 1),
  ('b3333333-0001-0001-0001-000000000003', 'Photosynthesis', true, 0),
  ('b3333333-0001-0001-0001-000000000003', 'Cellular respiration', false, 1),
  ('b3333333-0001-0001-0001-000000000003', 'Fermentation', false, 2),
  ('b3333333-0001-0001-0001-000000000003', 'Osmosis', false, 3),
  ('b3333333-0001-0001-0001-000000000004', 'H₂O', true, 0),
  ('b3333333-0001-0001-0001-000000000004', 'CO₂', false, 1),
  ('b3333333-0001-0001-0001-000000000004', 'NaCl', false, 2),
  ('b3333333-0001-0001-0001-000000000004', 'O₂', false, 3),
  ('b3333333-0001-0001-0001-000000000006', 'True', true, 0),
  ('b3333333-0001-0001-0001-000000000006', 'False', false, 1),
  ('b3333333-0001-0001-0001-000000000007', 'Inner core', true, 0),
  ('b3333333-0001-0001-0001-000000000007', 'Outer core', false, 1),
  ('b3333333-0001-0001-0001-000000000007', 'Mantle', false, 2),
  ('b3333333-0001-0001-0001-000000000007', 'Crust', false, 3);


-- ============================================================
-- GED Social Studies Practice Test
-- ============================================================
INSERT INTO public.tests (id, title, description, subject, time_limit_minutes, is_public)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'GED Social Studies Practice Test 1',
  'Practice test covering U.S. history, civics, economics, and geography for the GED Social Studies exam.',
  'GED Social Studies',
  70,
  true
);

INSERT INTO public.sections (id, test_id, title, description, sort_order) VALUES
  ('a4444444-0001-0001-0001-000000000001', '44444444-4444-4444-4444-444444444444', 'U.S. History', 'Key events and figures in American history', 0),
  ('a4444444-0001-0001-0001-000000000002', '44444444-4444-4444-4444-444444444444', 'Civics & Government', 'The U.S. Constitution, branches of government, and civic participation', 1),
  ('a4444444-0001-0001-0001-000000000003', '44444444-4444-4444-4444-444444444444', 'Economics', 'Basic economic concepts and systems', 2);

INSERT INTO public.questions (id, section_id, question_type, content, explanation, points, sort_order, accepted_answers) VALUES
  ('b4444444-0001-0001-0001-000000000001', 'a4444444-0001-0001-0001-000000000001', 'multiple_choice', 'The Declaration of Independence was adopted in which year?', 'The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.', 1, 0, NULL),
  ('b4444444-0001-0001-0001-000000000002', 'a4444444-0001-0001-0001-000000000001', 'true_false', 'The Emancipation Proclamation freed all enslaved people in the United States immediately upon signing.', 'The Emancipation Proclamation (1863) only freed enslaved people in Confederate states. It did not apply to border states or areas already under Union control.', 1, 1, NULL),
  ('b4444444-0001-0001-0001-000000000003', 'a4444444-0001-0001-0001-000000000001', 'short_answer', 'Who was the first President of the United States?', 'George Washington served as the first President from 1789 to 1797.', 1, 2, ARRAY['George Washington', 'Washington']),
  ('b4444444-0001-0001-0001-000000000004', 'a4444444-0001-0001-0001-000000000002', 'multiple_choice', 'How many branches does the U.S. federal government have?', 'The U.S. government has three branches: Legislative, Executive, and Judicial.', 1, 0, NULL),
  ('b4444444-0001-0001-0001-000000000005', 'a4444444-0001-0001-0001-000000000002', 'multiple_choice', 'Which amendment to the U.S. Constitution guarantees freedom of speech?', 'The First Amendment protects freedom of speech, religion, press, assembly, and petition.', 1, 1, NULL),
  ('b4444444-0001-0001-0001-000000000006', 'a4444444-0001-0001-0001-000000000002', 'true_false', 'The Supreme Court has the power of judicial review, meaning it can declare laws unconstitutional.', 'Judicial review was established by Marbury v. Madison (1803).', 1, 2, NULL),
  ('b4444444-0001-0001-0001-000000000007', 'a4444444-0001-0001-0001-000000000003', 'multiple_choice', 'In a market economy, prices are primarily determined by:', 'In a market economy, supply and demand determine the prices of goods and services.', 1, 0, NULL),
  ('b4444444-0001-0001-0001-000000000008', 'a4444444-0001-0001-0001-000000000003', 'short_answer', 'What is inflation?', 'Inflation is the general increase in prices and decrease in purchasing power over time.', 1, 1, ARRAY['a general increase in prices', 'the general increase in prices over time', 'rise in prices', 'increase in prices']);

INSERT INTO public.answer_options (question_id, content, is_correct, sort_order) VALUES
  ('b4444444-0001-0001-0001-000000000001', '1776', true, 0),
  ('b4444444-0001-0001-0001-000000000001', '1789', false, 1),
  ('b4444444-0001-0001-0001-000000000001', '1781', false, 2),
  ('b4444444-0001-0001-0001-000000000001', '1774', false, 3),
  ('b4444444-0001-0001-0001-000000000002', 'True', false, 0),
  ('b4444444-0001-0001-0001-000000000002', 'False', true, 1),
  ('b4444444-0001-0001-0001-000000000004', 'Three', true, 0),
  ('b4444444-0001-0001-0001-000000000004', 'Two', false, 1),
  ('b4444444-0001-0001-0001-000000000004', 'Four', false, 2),
  ('b4444444-0001-0001-0001-000000000004', 'Five', false, 3),
  ('b4444444-0001-0001-0001-000000000005', 'First Amendment', true, 0),
  ('b4444444-0001-0001-0001-000000000005', 'Second Amendment', false, 1),
  ('b4444444-0001-0001-0001-000000000005', 'Fifth Amendment', false, 2),
  ('b4444444-0001-0001-0001-000000000005', 'Fourteenth Amendment', false, 3),
  ('b4444444-0001-0001-0001-000000000006', 'True', true, 0),
  ('b4444444-0001-0001-0001-000000000006', 'False', false, 1),
  ('b4444444-0001-0001-0001-000000000007', 'Supply and demand', true, 0),
  ('b4444444-0001-0001-0001-000000000007', 'The government', false, 1),
  ('b4444444-0001-0001-0001-000000000007', 'International trade agreements', false, 2),
  ('b4444444-0001-0001-0001-000000000007', 'The Federal Reserve', false, 3);
