#r "canlibCLSNET.dll"
#r "kvadblibCLSNET.dll"

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using canlibCLSNET;
using Kvaser.Kvadblib;

public class Startup
{

    static Func<object, Task<object>> nodeRead;

    static string filename = "messages.dbc";
    static int channel = 0;

    static int chanhandle;
    static Kvadblib.Hnd dbhandle;

    List<Signal> signals = new List<Signal>();

    public async Task<object> Invoke(dynamic input) {

        nodeRead = input.read;

        return new {
            init = (Func<object,Task<object>>)Init,
            request = (Func<object,Task<object>>)Request,
            send = (Func<object,Task<object>>)Send,
            close = (Func<object,Task<object>>)Close
        };
    }

    private static async Task<object> Init(object input)
    {

        Canlib.canStatus status;
        Kvadblib.Status dbstatus;

        //Initialize, open channel and go on bus
        Canlib.canInitializeLibrary();

        chanhandle = Canlib.canOpenChannel(channel, Canlib.canOPEN_ACCEPT_VIRTUAL);
        DisplayError((Canlib.canStatus)chanhandle, "canSetBusParams");

        status = Canlib.canSetBusParams(chanhandle, Canlib.canBITRATE_250K, 0, 0, 0, 0, 0);
        DisplayError(status, "canSetBusParams");

        status = Canlib.canBusOn(chanhandle);
        DisplayError(status, "canBusOn");

        //Load database
        dbhandle = new Kvadblib.Hnd();
        dbstatus = Kvadblib.Open(out dbhandle);
        DisplayDBError(dbstatus, "Opening database handle ");
        dbstatus = Kvadblib.ReadFile(dbhandle, filename);
        DisplayDBError(dbstatus, "Reading database from file ");

        //Start dumping messages
        if (dbstatus == Kvadblib.Status.OK && status == Canlib.canStatus.canOK)
        {
            Task.Run(() => DumpMessageLoop());
        }

        return 0;
    }

    private static async Task DumpMessageLoop()
    {

        Canlib.canStatus status;
        bool finished = false;

        //These variables hold the incoming message
        byte[] data = new byte[8];
        int id;
        int dlc;
        int flags;
        long time;

        Console.WriteLine("Channel opened.");

        while (!finished)
        {
            //Wait for 100 ms for a message on the channel
            status = Canlib.canReadWait(chanhandle, out id, data, out dlc, out flags, out time, 100);

            //Loop until all messages from the past 100 ms have been displayed, or an error occurs
            if (status == Canlib.canStatus.canOK)
            {
                if ((flags & Canlib.canMSG_ERROR_FRAME) != 0)
                {
                    Console.Write("***Error Frame received***");
                }
                else
                {
                    DumpMessage(id, data, dlc, flags, time);
                }
            }

            //Call DisplayError and exit in case an actual error occurs
            else if (status != Canlib.canStatus.canERR_NOMSG)
            {
                DisplayError(status, "canRead/canReadWait");
                finished = true;
            }

        }
    }

    private static async Task DumpMessage(int id, byte[] data, int dlc, int flags, long time)
    {
        Kvadblib.Status status;
        Kvadblib.MessageHnd mh = new Kvadblib.MessageHnd();
        Kvadblib.SignalHnd sh = new Kvadblib.SignalHnd();

        //Flips the EXT bit if the EXT flag is set
        if ((flags & Canlib.canMSG_EXT) != 0)
        {
            id ^= -2147483648;
        }

        //Find the database message whose id matches the one
        //from the incoming message
        status = Kvadblib.GetMsgById(dbhandle, id, out mh);
        Console.WriteLine("Reading message with id " + id);
        DisplayDBError(status, "Reading message with id " + id);

        //Print the message info
        if (status == Kvadblib.Status.OK)
        {
            string msgName;
            status = Kvadblib.GetMsgName(mh, out msgName);

            Console.WriteLine("Message received: {0}", msgName);
            int msgId;
            Kvadblib.MESSAGE msgFlags;
            status = Kvadblib.GetMsgId(mh, out msgId, out msgFlags);

            Console.WriteLine("Id: {0}, flags: {1}", msgId, msgFlags);

            //Iterate through all the signals and print their name, value and unit
            status = Kvadblib.GetFirstSignal(mh, out sh);
            while (status == Kvadblib.Status.OK)
            {
                string signalname;
                status = Kvadblib.GetSignalName(sh, out signalname);

                string unit;
                status = Kvadblib.GetSignalUnit(sh, out unit);

                double value;
                status = Kvadblib.GetSignalValueFloat(sh, out value, data, dlc);

                // Console.WriteLine("Signal - {0}: {1} {2}", signalname, value, unit);

                // Sending to Node
                object nodeData = new { name = signalname, value = value };
                await nodeRead(nodeData);

                status = Kvadblib.GetNextSignal(mh, out sh);
            }
        }
    }

    private static async Task<object> Send(dynamic input)
    {
        Console.WriteLine(input);

        // byte[] data = new byte[8];

        // Kvadblib.Status status = Kvadblib.Status.OK;
        // Kvadblib.MessageHnd mh = new Kvadblib.MessageHnd();
        // Kvadblib.SignalHnd sh;
        // bool error = false;

        // foreach (Signal s in input)
        // {
        //     double min, max;
        //     status = Kvadblib.GetSignalByName(mh, s.name, out sh);

        //     if (status != Kvadblib.Status.OK)
        //     {
        //         DisplayDBError(status, "Finding signal");
        //         error = true;
        //         break;
        //     }

        //     Kvadblib.GetSignalValueLimits(sh, out min, out max);

        //     status = Kvadblib.StoreSignalValuePhys(sh, data, 8, s.Value);

        //     //Check if the signal value was successfully stored and that it's in the correct interval
        //     if (status != Kvadblib.Status.OK || s.Value < min || s.Value > max)
        //     {
        //         error = true;
        //         break;
        //     }
        // }

        // if (!error)
        // {
        //     Canlib.canWriteWait(chanhandle, msgId, data, 8, msgFlags, 50);
        // }

        return null;
    }

    private static async Task<object> Request(dynamic input)
    {
        Canlib.canWriteWait(chanhandle, 1900, null, 0, Canlib.canMSG_RTR, 50);
        return null;
    }

    private static async Task<object> Close(object input)
    {
        Canlib.canStatus status;

        //Go off bus and close channel
        status = Canlib.canBusOff(chanhandle);
        DisplayError(status, "canBusOff");

        status = Canlib.canClose(chanhandle);
        DisplayError(status, "canClose");

        //Wait for the user to press a key before exiting, in case the console closes automatically on exit.
        Console.WriteLine("Channel closed.");
        return 0;
    }

    //Displays error messages when a call to Canlib fails
    private static void DisplayError(Canlib.canStatus status, string method)
    {
        if (status < 0)
        {
            Console.WriteLine(method + " failed: " + status.ToString());
        }
    }

    //Displays messages for Kvadblib calls
    private static void DisplayDBError(Kvadblib.Status status, string method)
    {
        if (status < 0)
        {
            Console.WriteLine(method + " failed: " + status.ToString());
        }
    }

    /*
     * Used for controling the textboxes. All properties except the current value are
     * effectively immutable.
     */
    class Signal
    {
        public string name { get; private set; }
        public double max { get; private set; }
        public double min { get; private set; }
        public double scale { get; private set; }
        private double val;
        public double Value
        {
            get { return val; }
            set
            {
                if(value >= min && value <= max)
                {
                    val = value;
                }
            }
        }

        public Signal(string name, double max, double min, double val, double scale)
        {
            this.name = name;
            this.max = max;
            this.min = min;
            this.val = val;
            this.scale = scale;
        }
    }
}
