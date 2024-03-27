using System;
using System.Collections.Generic;

namespace imagine.Checker
{
    public class CheckerManager
    {
        static IChecker _currentChecker = new FileBaseChecker();
        public static IChecker CurrentChecker
        {
            get => _currentChecker;
        }
    }
}
