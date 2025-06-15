interface Employee {
  partner: string;
  bpext: string;
  name_first: string;
  email: string;
  roles: RoleItem;
  mod_uid: string;
  exp_date: string | null;
}

export type RoleItem = {
  cost_center: string;
  type: string;
  user_type: string;
};