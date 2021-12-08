import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-tw';

dayjs.extend(relativeTime);

export default dayjs;
