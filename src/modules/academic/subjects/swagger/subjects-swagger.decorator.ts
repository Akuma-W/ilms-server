import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { SubjectEntity } from '../entities/subject.entity';

export function ApiCreateSubject() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new academic subject (Admin only)' }),
    ApiAuth(),
    ApiBody({ type: CreateSubjectDto }),
    ApiOkResponse({
      description: 'Subject created successfully',
      type: SubjectEntity,
    }),
  );
}

export function ApiGetSubjects() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Retrieve subjects (Admin: all/school filter; Teacher/Student: current school)',
    }),
    ApiAuth(),
    ApiQuery({ name: 'schoolId', required: false, type: String }),
    ApiQuery({ name: 'search', required: false, type: String }),
    ApiQuery({ name: 'isActive', required: false, type: Boolean }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiOkResponse({
      description: 'List of subjects retrieved successfully',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              schoolId: '123e4567-e89b-12d3-a456-426614174001',
              code: 'IT001',
              name: 'Nhập môn lập trình',
              description: 'Môn học cơ sở ngành',
              credits: 4,
              isActive: true,
              createdAt: '2026-04-10T13:20:56.000Z',
              updatedAt: '2026-04-10T13:20:56.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            totalItems: 1,
            totalPages: 1,
          },
        },
      },
    }),
  );
}

export function ApiGetSubject() {
  return applyDecorators(
    ApiOperation({ summary: 'Get subject details by ID' }),
    ApiAuth(),
    ApiParam({ name: 'id', description: 'Subject UUID', type: String }),
    ApiOkResponse({
      description: 'Subject retrieved successfully',
      type: SubjectEntity,
    }),
  );
}

export function ApiUpdateSubject() {
  return applyDecorators(
    ApiOperation({ summary: 'Update subject by ID (Admin only)' }),
    ApiAuth(),
    ApiParam({ name: 'id', description: 'Subject UUID', type: String }),
    ApiBody({ type: UpdateSubjectDto }),
    ApiOkResponse({
      description: 'Subject updated successfully',
      type: SubjectEntity,
    }),
  );
}

export function ApiDeleteSubject() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete subject by ID (Admin only)' }),
    ApiAuth(),
    ApiParam({ name: 'id', description: 'Subject UUID', type: String }),
    ApiOkResponse({
      description: 'Subject deleted successfully',
    }),
  );
}

export function ApiGetSubjectClasses() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all active classes under a specific subject',
    }),
    ApiAuth(),
    ApiParam({ name: 'id', description: 'Subject UUID', type: String }),
    ApiOkResponse({
      description: 'Classes under subject retrieved successfully',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174010',
              title: 'IT001.N11.PMCL',
              subject: 'Nhập môn lập trình',
              courseCode: 'IT001-K21',
              semester: '2026-1',
              totalStudents: 45,
              maxStudents: 60,
              isPrivate: false,
              teacher: {
                id: '123e4567-e89b-12d3-a456-426614174020',
                fullName: 'Nguyễn Văn A',
              },
            },
          ],
        },
      },
    }),
  );
}
