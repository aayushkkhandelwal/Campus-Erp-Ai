import prisma from '../../prisma/client';

export interface CreateSlotInput {
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
}

export const publishTimetable = async (semester: string, slots: CreateSlotInput[]) => {
  // Delete existing slots for this semester
  await prisma.timetableSlot.deleteMany({
    where: { semester },
  });

  // Create new slots
  const created = await Promise.all(
    slots.map((slot) =>
      prisma.timetableSlot.create({
        data: {
          semester,
          day: slot.day,
          time: slot.time,
          subject: slot.subject,
          faculty: slot.faculty,
          room: slot.room,
          status: 'PUBLISHED',
        },
      })
    )
  );

  return created;
};

export const getTimetable = async (semester?: string) => {
  const where: any = {};
  if (semester) where.semester = semester;

  return prisma.timetableSlot.findMany({
    where,
    orderBy: [{ semester: 'asc' }, { day: 'asc' }],
  });
};
