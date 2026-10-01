import { QuestionInfo, SurveyRecord } from '../types';

export type ActionPriority = 'Immediate' | 'High' | 'Moderate';

export interface ActionEvidence {
  questionId: string;
  question: string;
  answer: string;
  citation: string;
}

export interface ParticipantAction {
  id: string;
  icon: 'heat' | 'water' | 'flood' | 'agriculture' | 'air' | 'preparedness' | 'nature' | 'waste' | 'energy' | 'awareness';
  sector: string;
  title: string;
  score: number;
  priority: ActionPriority;
  timing: string;
  challenge: string;
  responseAlignment: string;
  actionSteps: string[];
  peopleImpact: string;
  beneficiaries: string[];
  implementers: string[];
  successIndicators: string[];
  evidence: ActionEvidence[];
}

export interface ParticipantActionPlan {
  record: SurveyRecord;
  actions: ParticipantAction[];
  highestPriorityScore: number;
  immediateActions: number;
  sectors: string[];
  summary: string;
}

export interface CommunityActionSummary {
  id: string;
  title: string;
  sector: string;
  participants: number;
  percentage: number;
  averageScore: number;
}

interface Trigger {
  questionId: string;
  answers: string[];
  weight: number;
}

interface ActionTemplate {
  id: string;
  icon: ParticipantAction['icon'];
  sector: string;
  title: string;
  challenge: string;
  triggers: Trigger[];
  minimumTriggerWeight?: number;
  problemAnswers: string[];
  allowProblemOnly?: boolean;
  preferredActions: string[];
  actionSteps: string[];
  peopleImpact: string;
  beneficiaries: string[];
  implementers: string[];
  successIndicators: string[];
}

const actionTemplates: ActionTemplate[] = [
  {
    id: 'heat-health',
    icon: 'heat',
    sector: 'Heat & public health',
    title: 'Neighbourhood heat-safety and cooling plan',
    challenge: 'Reported heat change, hotter summers or heat-related health effects indicate a need for practical exposure reduction.',
    triggers: [
      { questionId: 'Q1', answers: ['Yes'], weight: 8 },
      { questionId: 'Q2', answers: ['Yes'], weight: 14 },
      { questionId: 'Q8', answers: ['Yes'], weight: 20 }
    ],
    allowProblemOnly: true,
    problemAnswers: ['Heat'],
    preferredActions: ['Tree Plantation'],
    actionSteps: [
      'Map the hottest walking, waiting and outdoor-work areas reported by residents.',
      'Create shaded rest points, drinking-water access and cool indoor recovery spaces.',
      'Share simple heat-safety guidance and a check-in list for vulnerable households.'
    ],
    peopleImpact: 'Reduces avoidable heat exposure and helps residents, students and outdoor workers act earlier when heat becomes uncomfortable or unsafe.',
    beneficiaries: ['Older adults', 'Children and students', 'Outdoor workers', 'People with existing health conditions'],
    implementers: ['Local health centre', 'Municipal ward team', 'Schools and colleges', 'Housing societies'],
    successIndicators: ['Shaded locations added', 'Water points kept functional', 'Households reached with heat guidance']
  },
  {
    id: 'water-security',
    icon: 'water',
    sector: 'Water security',
    title: 'Household water conservation and safe-storage programme',
    challenge: 'Reported shortages or reduced drinking-water availability support conservation, storage hygiene and local supply monitoring.',
    triggers: [
      { questionId: 'Q5', answers: ['Sometimes'], weight: 13 },
      { questionId: 'Q5', answers: ['Frequently'], weight: 20 },
      { questionId: 'Q10', answers: ['Decreased'], weight: 17 }
    ],
    allowProblemOnly: true,
    problemAnswers: ['Water Shortage'],
    preferredActions: ['Water Conservation'],
    actionSteps: [
      'Record the timing and duration of local supply interruptions instead of relying on estimates.',
      'Repair visible leaks and promote low-cost water-saving fixtures in homes and shared buildings.',
      'Assess roof-water harvesting and maintain covered, regularly cleaned storage containers.'
    ],
    peopleImpact: 'Can improve day-to-day water reliability, reduce household expense during shortages and lower contamination risks from unsafe storage.',
    beneficiaries: ['Households with intermittent supply', 'Women and caregivers', 'Schools', 'Small local businesses'],
    implementers: ['Water department', 'Housing societies', 'Panchayat or ward office', 'Resident volunteers'],
    successIndicators: ['Leaks repaired', 'Litres of storage or harvesting capacity added', 'Supply interruptions logged']
  },
  {
    id: 'flood-readiness',
    icon: 'flood',
    sector: 'Flooding & infrastructure',
    title: 'Waterlogging prevention and safe-access plan',
    challenge: 'Reported waterlogging, rainfall change or daily disruption supports drainage maintenance and household preparedness.',
    triggers: [
      { questionId: 'Q4', answers: ['Sometimes'], weight: 13 },
      { questionId: 'Q4', answers: ['Frequently'], weight: 20 },
      { questionId: 'Q3', answers: ['Yes'], weight: 7 },
      { questionId: 'Q7', answers: ['Yes'], weight: 7 }
    ],
    minimumTriggerWeight: 13,
    allowProblemOnly: true,
    problemAnswers: ['Flooding', 'Rainfall changes'],
    preferredActions: ['Waste Management', 'Water Conservation'],
    actionSteps: [
      'Document recurring waterlogging points with dates and photographs before the monsoon.',
      'Clear local drain inlets and escalate blocked or damaged drains to the responsible authority.',
      'Mark safer walking routes and protect medicines, documents and electrical items above expected water level.'
    ],
    peopleImpact: 'Improves access during heavy rain, reduces exposure to contaminated water and helps households protect essential belongings.',
    beneficiaries: ['Residents in low-lying streets', 'Commuters', 'Schoolchildren', 'Ground-floor shops and homes'],
    implementers: ['Stormwater department', 'Ward office', 'Housing societies', 'Community disaster volunteers'],
    successIndicators: ['Waterlogging points documented', 'Drain blockages resolved', 'Safe routes communicated before monsoon']
  },
  {
    id: 'agriculture-plants',
    icon: 'agriculture',
    sector: 'Agriculture & plant health',
    title: 'Climate-resilient planting and soil-moisture support',
    challenge: 'Perceived effects on crops or plants and rainfall change justify locally appropriate water and soil conservation measures.',
    triggers: [
      { questionId: 'Q9', answers: ['Yes'], weight: 20 },
      { questionId: 'Q3', answers: ['Yes'], weight: 10 },
      { questionId: 'Q5', answers: ['Frequently', 'Sometimes'], weight: 7 }
    ],
    minimumTriggerWeight: 17,
    allowProblemOnly: true,
    problemAnswers: ['Rainfall changes', 'Water Shortage'],
    preferredActions: ['Tree Plantation', 'Water Conservation'],
    actionSteps: [
      'Use native, locally suitable plants and avoid claiming crop suitability without local agricultural advice.',
      'Add mulching, compost and small rainwater-capture features to reduce soil-moisture loss.',
      'Record planting dates, plant survival and visible stress so the approach can be adjusted.'
    ],
    peopleImpact: 'Supports plant survival, household food gardens and green spaces while reducing unnecessary water use.',
    beneficiaries: ['Farmers and gardeners', 'Households with kitchen gardens', 'Schools', 'Neighbourhood green spaces'],
    implementers: ['Agriculture extension staff', 'Garden groups', 'Schools', 'Local nurseries'],
    successIndicators: ['Plant survival rate', 'Area mulched or treated', 'Water use tracked during dry periods']
  },
  {
    id: 'air-quality',
    icon: 'air',
    sector: 'Air quality',
    title: 'Clean-air exposure reduction and reporting',
    challenge: 'A perceived air-quality effect is a reason to reduce visible local pollution sources while avoiding unsupported claims about pollutant levels.',
    triggers: [{ questionId: 'Q11', answers: ['Yes'], weight: 21 }],
    allowProblemOnly: true,
    problemAnswers: ['Air Pollution'],
    preferredActions: ['Waste Management', 'Renewable Energy', 'Public Awareness'],
    actionSteps: [
      'Report open waste burning, unmanaged dust and visibly smoky sources through local complaint channels.',
      'Promote walking, cycling, shared travel or clean transport where practical and safe.',
      'Use official monitoring information when issuing air-quality health advice; do not infer AQI from the survey.'
    ],
    peopleImpact: 'Encourages reduction of avoidable smoke and dust exposure and improves community awareness without fabricating pollution measurements.',
    beneficiaries: ['People with respiratory sensitivity', 'Children', 'Street-facing workers', 'Pedestrians and cyclists'],
    implementers: ['Pollution control authority', 'Municipal sanitation team', 'Schools', 'Resident groups'],
    successIndicators: ['Pollution complaints resolved', 'No-burning commitments adopted', 'Residents directed to official monitoring sources']
  },
  {
    id: 'continuity',
    icon: 'preparedness',
    sector: 'Emergency preparedness',
    title: 'Community continuity and extreme-weather checklist',
    challenge: 'Reported increases in extreme events or disruption to daily activities support a basic continuity plan.',
    triggers: [
      { questionId: 'Q6', answers: ['Yes'], weight: 18 },
      { questionId: 'Q7', answers: ['Yes'], weight: 16 }
    ],
    minimumTriggerWeight: 10,
    problemAnswers: ['Heat', 'Flooding', 'Rainfall changes', 'Water Shortage'],
    preferredActions: ['Public Awareness'],
    actionSteps: [
      'Create a verified contact list for health care, utilities, transport help and local emergency services.',
      'Identify people who may need assistance and agree on a neighbour check-in process.',
      'Prepare a short continuity checklist for medicines, charging, drinking water and safe travel.'
    ],
    peopleImpact: 'Helps people recover essential routines faster and makes community assistance more organised during disruptive conditions.',
    beneficiaries: ['People living alone', 'Caregivers', 'Daily commuters', 'People dependent on regular medicines'],
    implementers: ['Ward disaster team', 'Housing committees', 'Health workers', 'Resident volunteers'],
    successIndicators: ['Emergency contacts verified', 'Check-in volunteers assigned', 'Continuity drill or review completed']
  },
  {
    id: 'green-cover',
    icon: 'nature',
    sector: 'Urban nature',
    title: 'Native shade and green-cover initiative',
    challenge: 'Heat or plant impacts combined with a preference for tree plantation support careful, maintainable green-cover action.',
    triggers: [
      { questionId: 'Q2', answers: ['Yes'], weight: 8 },
      { questionId: 'Q9', answers: ['Yes'], weight: 10 }
    ],
    problemAnswers: ['Heat'],
    preferredActions: ['Tree Plantation'],
    actionSteps: [
      'Select native shade species with guidance on roots, utilities, available soil and long-term water needs.',
      'Prioritise schools, walking routes and heat-exposed shared spaces rather than planting without a maintenance plan.',
      'Assign watering and survival checks for at least the first two growing seasons.'
    ],
    peopleImpact: 'Creates usable shade and more comfortable public spaces while improving the chance that planted trees survive.',
    beneficiaries: ['Pedestrians', 'Students', 'Street vendors', 'Residents near low-shade spaces'],
    implementers: ['Municipal garden department', 'Schools', 'Housing societies', 'Local environmental groups'],
    successIndicators: ['Trees surviving after 12 months', 'Shade-priority sites covered', 'Named maintenance owners assigned']
  },
  {
    id: 'waste-drainage',
    icon: 'waste',
    sector: 'Waste & sanitation',
    title: 'Waste segregation and drain-protection campaign',
    challenge: 'Waterlogging or air-quality concern combined with a waste-management preference supports cleaner collection and drain protection.',
    triggers: [
      { questionId: 'Q4', answers: ['Frequently', 'Sometimes'], weight: 9 },
      { questionId: 'Q11', answers: ['Yes'], weight: 9 }
    ],
    problemAnswers: ['Flooding', 'Air Pollution'],
    preferredActions: ['Waste Management'],
    actionSteps: [
      'Separate wet, dry and hazardous household waste using the collection system available locally.',
      'Identify dumping points near drain inlets and coordinate removal before heavy-rain periods.',
      'Discourage open burning and publish the correct collection or complaint contact.'
    ],
    peopleImpact: 'Reduces avoidable drain blockages, neighbourhood smoke and contact with unmanaged waste.',
    beneficiaries: ['Sanitation workers', 'Households near drains', 'Children', 'People with respiratory sensitivity'],
    implementers: ['Municipal sanitation team', 'Housing societies', 'Waste collectors', 'Resident volunteers'],
    successIndicators: ['Households segregating waste', 'Dumping points cleared', 'Drain-adjacent waste complaints resolved']
  },
  {
    id: 'clean-energy',
    icon: 'energy',
    sector: 'Clean energy',
    title: 'Energy-saving and rooftop-solar assessment',
    challenge: 'A renewable-energy preference supports an assessment of feasible efficiency and solar measures, not an assumed installation.',
    triggers: [],
    problemAnswers: ['Air Pollution', 'Heat'],
    preferredActions: ['Renewable Energy'],
    actionSteps: [
      'Complete a basic electricity-use audit and address avoidable consumption first.',
      'Check roof ownership, shade, structural condition, metering and approved subsidies before proposing solar.',
      'Compare quotations and expected generation using qualified installers and documented assumptions.'
    ],
    peopleImpact: 'Can reduce electricity expense and emissions where efficiency or solar is technically and financially suitable.',
    beneficiaries: ['Households', 'Schools', 'Small businesses', 'Shared residential buildings'],
    implementers: ['Building owners', 'Electricity distributor', 'Qualified solar installers', 'Energy-awareness groups'],
    successIndicators: ['Energy audits completed', 'Verified efficiency measures adopted', 'Feasible solar capacity assessed']
  },
  {
    id: 'climate-literacy',
    icon: 'awareness',
    sector: 'Awareness & participation',
    title: 'Local climate literacy and citizen-reporting circle',
    challenge: 'Concern, limited cause awareness or a public-awareness preference supports practical education tied to local observations.',
    triggers: [
      { questionId: 'Q13', answers: ['No'], weight: 21 },
      { questionId: 'Q13', answers: ['A little'], weight: 14 }
    ],
    problemAnswers: ['Other'],
    preferredActions: ['Public Awareness'],
    actionSteps: [
      'Run a short session separating observed local problems, possible explanations and evidence still needed.',
      'Teach residents how to document dates, locations and impacts without exposing personal information.',
      'Connect observations to verified municipal, health or environmental reporting channels.'
    ],
    peopleImpact: 'Builds confidence to take practical action, reduces misinformation and gives local authorities more structured community feedback.',
    beneficiaries: ['Students', 'Resident volunteers', 'Community leaders', 'Survey participants'],
    implementers: ['Schools and colleges', 'Local NGOs', 'Ward office', 'Trained community facilitators'],
    successIndicators: ['Residents trained', 'Reports submitted with usable evidence', 'Sources and uncertainty included in public material']
  }
];

const getPriority = (score: number): ActionPriority => score >= 75 ? 'Immediate' : score >= 58 ? 'High' : 'Moderate';

const getTiming = (priority: ActionPriority) => {
  if (priority === 'Immediate') return 'Start in 0–30 days';
  if (priority === 'High') return 'Plan within 1–3 months';
  return 'Build into the 3–12 month plan';
};

export function buildParticipantActionPlan(record: SurveyRecord, questions: Record<string, QuestionInfo>): ParticipantActionPlan {
  const concernBoost = record.answers.Q12 === 'Very Concerned' ? 5 : record.answers.Q12 === 'Concerned' ? 3 : 0;

  const actions = actionTemplates.flatMap<ParticipantAction>((template) => {
    const matchedTriggers = template.triggers.filter(trigger => {
      const answer = record.answers[trigger.questionId];
      return answer !== null && trigger.answers.includes(answer);
    });
    const problemMatch = Boolean(record.answers.Q14 && template.problemAnswers.includes(record.answers.Q14));
    const preferenceMatch = Boolean(record.answers.Q15 && template.preferredActions.includes(record.answers.Q15));
    const triggerWeight = matchedTriggers.reduce((total, trigger) => total + trigger.weight, 0);
    const triggerMatch = triggerWeight >= (template.minimumTriggerWeight || 1);
    if (!triggerMatch && !preferenceMatch && !(problemMatch && template.allowProblemOnly)) return [];

    const score = Math.min(96, 25 + triggerWeight
      + (problemMatch ? 22 : 0) + (preferenceMatch ? 20 : 0) + concernBoost);
    const priority = getPriority(score);
    const evidenceIds = new Set(matchedTriggers.map(trigger => trigger.questionId));
    if (problemMatch) evidenceIds.add('Q14');
    if (preferenceMatch) evidenceIds.add('Q15');
    const evidence = [...evidenceIds].map(questionId => ({
      questionId,
      question: questions[questionId]?.text || questionId,
      answer: record.answers[questionId] || 'No answer recorded',
      citation: `RESPONSES.pdf · p.${record.pageNumber} · row ${record.rowNumber} · ${questionId}`
    }));
    const alignments = [
      problemMatch ? `local priority: ${record.answers.Q14}` : null,
      preferenceMatch ? `preferred action: ${record.answers.Q15}` : null
    ].filter(Boolean);

    return [{
      id: template.id,
      icon: template.icon,
      sector: template.sector,
      title: template.title,
      score,
      priority,
      timing: getTiming(priority),
      challenge: template.challenge,
      responseAlignment: alignments.length
        ? `Directly aligned with the participant's ${alignments.join(' and ')}.`
        : 'Triggered by the participant’s recorded experience answers.',
      actionSteps: template.actionSteps,
      peopleImpact: template.peopleImpact,
      beneficiaries: template.beneficiaries,
      implementers: template.implementers,
      successIndicators: template.successIndicators,
      evidence
    }];
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const highestPriorityScore = actions[0]?.score || 0;
  const immediateActions = actions.filter(action => action.priority === 'Immediate').length;
  const sectors = [...new Set(actions.map(action => action.sector))];
  const topAction = actions[0];
  const summary = topAction
    ? `${record.respondentId}'s strongest response-linked priority is ${topAction.title.toLowerCase()}. ${actions.length} practical action ${actions.length === 1 ? 'area is' : 'areas are'} suggested for local discussion and validation.`
    : 'The recorded answers do not trigger a specific action rule. Review the source response before planning any intervention.';
  return { record, actions, highestPriorityScore, immediateActions, sectors, summary };
}

export function buildCommunityActionSummary(records: SurveyRecord[], questions: Record<string, QuestionInfo>): CommunityActionSummary[] {
  const collected = new Map<string, { title: string; sector: string; participants: number; scores: number[] }>();
  records.forEach(record => {
    buildParticipantActionPlan(record, questions).actions.forEach(action => {
      const current = collected.get(action.id) || { title: action.title, sector: action.sector, participants: 0, scores: [] };
      current.participants += 1;
      current.scores.push(action.score);
      collected.set(action.id, current);
    });
  });

  return [...collected.entries()].map(([id, item]) => ({
    id,
    title: item.title,
    sector: item.sector,
    participants: item.participants,
    percentage: Number(((item.participants / records.length) * 100).toFixed(1)),
    averageScore: Math.round(item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length)
  })).sort((a, b) => b.participants - a.participants || b.averageScore - a.averageScore);
}
