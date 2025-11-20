#!/usr/bin/env python3
"""
CodeCarbon integration for tracking CO2 emissions during AI processing.
This script tracks emissions for a specific duration and returns the results.
"""
import sys
import json
import os
import time
import tempfile

def track_emissions(duration_seconds):
    """
    Track CO2 emissions for a given duration.
    
    Args:
        duration_seconds: How long to track emissions (in seconds)
    
    Returns:
        Dictionary with emissions data
    """
    try:
        from codecarbon import EmissionsTracker
        
        # Create a temporary directory for emissions output
        output_dir = tempfile.mkdtemp()
        output_file = os.path.join(output_dir, 'emissions.csv')
        
        # Initialize CodeCarbon tracker
        tracker = EmissionsTracker(
            project_name="GreenQuest",
            experiment_id=f"clip_analysis_{int(time.time())}",
            output_dir=output_dir,
            log_level="error",  # Reduce logging noise
            measure_power_secs=1,  # Measure every second for accuracy
        )
        
        # Start tracking
        tracker.start()
        
        # Wait for the specified duration (simulating processing time)
        time.sleep(duration_seconds)
        
        # Stop tracking and get results
        emissions_data = tracker.stop()
        
        # Read the emissions CSV file
        emissions_info = {
            'emissions_kg': float(emissions_data) if emissions_data else 0,
            'energy_consumed_kwh': 0,
            'duration_seconds': duration_seconds,
        }
        
        # Try to read detailed data from CSV if available
        try:
            import pandas as pd
            if os.path.exists(output_file):
                df = pd.read_csv(output_file)
                if not df.empty:
                    last_row = df.iloc[-1]
                    emissions_info.update({
                        'emissions_kg': float(last_row.get('emissions', emissions_data or 0)),
                        'energy_consumed_kwh': float(last_row.get('energy_consumed', 0)),
                        'duration_seconds': float(last_row.get('duration', duration_seconds)),
                        'emissions_rate_kg_per_hour': float(last_row.get('emissions_rate', 0)),
                        'cpu_power_watts': float(last_row.get('cpu_power', 0)),
                        'gpu_power_watts': float(last_row.get('gpu_power', 0)),
                        'ram_power_watts': float(last_row.get('ram_power', 0)),
                        'carbon_intensity': float(last_row.get('carbon_intensity', 0)),
                    })
        except Exception as e:
            # If pandas is not available or CSV read fails, use basic data
            pass
        
        # Clean up temporary directory
        try:
            import shutil
            shutil.rmtree(output_dir, ignore_errors=True)
        except:
            pass
        
        return emissions_info
        
    except ImportError:
        # CodeCarbon not installed - return estimation
        # Estimate based on world average: 0.475 kg CO2/kWh
        # Assume ~50W average power for CLIP processing
        estimated_energy_kwh = (duration_seconds / 3600) * 0.05  # 50W = 0.05 kW
        carbon_intensity = 0.475  # kg CO2/kWh (world average)
        return {
            'emissions_kg': estimated_energy_kwh * carbon_intensity,
            'energy_consumed_kwh': estimated_energy_kwh,
            'duration_seconds': duration_seconds,
            'note': 'Estimated (CodeCarbon not installed)',
        }
    except Exception as e:
        # Fallback estimation
        estimated_energy_kwh = (duration_seconds / 3600) * 0.05
        carbon_intensity = 0.475
        return {
            'error': str(e),
            'emissions_kg': estimated_energy_kwh * carbon_intensity,
            'energy_consumed_kwh': estimated_energy_kwh,
            'duration_seconds': duration_seconds,
            'note': 'Estimated (CodeCarbon error)',
        }

if __name__ == '__main__':
    # Read input from stdin
    try:
        input_data = json.loads(sys.stdin.read())
        duration = float(input_data.get('duration_seconds', 1.0))
    except:
        duration = 1.0
    
    # Track emissions
    result = track_emissions(duration)
    
    # Output result as JSON
    print(json.dumps(result))

