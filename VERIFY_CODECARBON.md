# How to Verify CodeCarbon Integration

## Quick Check Methods

### 1. Check if CodeCarbon Python Package is Installed

```bash
python3 -c "import codecarbon; print('CodeCarbon version:', codecarbon.__version__)"
```

**Expected Output:**
- ✅ If installed: `CodeCarbon version: 2.x.x`
- ❌ If not installed: `ModuleNotFoundError: No module named 'codecarbon'`

### 2. Check if Integration Files Exist

```bash
# Check Python script
test -f server/codecarbon_tracker.py && echo "✓ Python script exists" || echo "✗ Missing"

# Check requirements file
test -f requirements.txt && echo "✓ Requirements file exists" || echo "✗ Missing"
```

### 3. Check Server Logs

When you submit an activity with an image, look for these log messages in your server console:

**If CodeCarbon is installed:**
```
[CodeCarbon] Emissions tracked: 0.000123 kg CO₂
[CodeCarbon] Energy consumed: 0.000259 kWh
```

**If CodeCarbon is NOT installed (fallback mode):**
```
[CodeCarbon] Note: Estimated (CodeCarbon not installed)
[CodeCarbon] Could not start tracker: ...
[CodeCarbon] Using estimated emissions: 0.000XXX kg CO₂
```

### 4. Check UI Display

After submitting an activity:
1. Go to the success screen
2. Look for a blue box labeled **"AI Processing Emissions"**
3. It should show:
   - CO₂ emissions in kg
   - Energy consumed in kWh
   - Processing duration in seconds

### 5. Check API Response

In your browser's developer console (Network tab), check the response from `/api/activities` POST request. It should include:

```json
{
  "aiVerification": {
    "score": 85,
    "matches": true,
    "emissions": {
      "co2_kg": 0.000123,
      "energy_kwh": 0.000259,
      "duration_seconds": 2.45
    }
  }
}
```

## Installation Status

**Current Status:** CodeCarbon is **NOT installed** (using fallback estimation)

To install CodeCarbon:
```bash
pip3 install -r requirements.txt
```

Or install directly:
```bash
pip3 install codecarbon pandas
```

## Testing the Integration

1. **Start the server:**
   ```bash
   npm run server
   ```

2. **Submit an activity with an image** through the UI

3. **Check server logs** for CodeCarbon messages

4. **Check the success screen** for emissions data

## What to Expect

- **With CodeCarbon installed:** Accurate measurements based on actual hardware power consumption
- **Without CodeCarbon:** Estimated values based on processing time and average power consumption (still accurate enough for tracking)

Both modes work - CodeCarbon provides more precise measurements, but the fallback estimation is sufficient for tracking AI processing emissions.

