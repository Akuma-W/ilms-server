import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AttendanceSummaryEntity } from '../entities/attendance-summary.entity';

export function ApiGetAttendanceSummary() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get classroom attendance breakdown and predicted scores for teacher inspection',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Attendance breakdown returned successfully',
      type: AttendanceSummaryEntity,
    }),
  );
}
