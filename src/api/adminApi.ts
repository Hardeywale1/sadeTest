import { apiClient } from './client';

export type AdminUser = { id:string;email:string;display_name:string;role:string;status:string;created_at:string;last_active_at?:string;active_sessions:number };
export type AdminDashboardData = {
  generated_at:string;days:number;
  overview:{total_users:number;new_today:number;new_period:number;active_24_hours:number;active_clinicians:number};
  users_by_role:Record<string,number>;
  signups:{date:string;count:number}[];
  care:{total:number;new_period:number;updated_24_hours:number;by_status:Record<string,number>};
  users:AdminUser[];
  recent_sign_ins:{user_id:string;email:string;display_name:string;role:string;at:string}[];
};

export const adminApi={
  async activity(days=30,limit=200):Promise<AdminDashboardData>{return (await apiClient.get('/v1/admin/activity',{params:{days,limit}})).data},
};
