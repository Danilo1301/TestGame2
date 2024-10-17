import { ObjectGroup } from "./objectGroup";

export class ObjectWatcher
{
    public groups = new Map<string, ObjectGroup>();

    public createGroup(id: string)
    {
        const group = new ObjectGroup(id);

        this.groups.set(id, group);

        return group;
    }

    public check()
    {
        for(const group of this.groups.values())
        {
            group.check();
        }
    }

    public setAsChangedAll()
    {
        for(const group of this.groups.values())
        {
            group.setAsChangedAll = true;
        }
    }
}