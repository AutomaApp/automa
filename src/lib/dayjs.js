import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/vi';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';

dayjs.extend(relativeTime);

export default dayjs;
