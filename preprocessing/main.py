import time
import logging
from bipartite_file_processor import BipartiteFileProcessor
from file_processor import FileProcessor
from utils import set_arguments, validate_file

def main():
    ap = set_arguments()
    args = vars(ap.parse_args())
    df_edges = validate_file(args['edges'], True)
    df_categories = validate_file(args['categories'])

    if args['categories2'] and args['edges2']:
        processor = BipartiteFileProcessor(args['reduction'], args['animation'], args['log'])
        dfs = {
            'edges_A': df_edges,
            'categories_A': df_categories,
            'edges_B': validate_file(args['edges2'], True),
            'categories_B': validate_file(args['categories2'])
        }
    else:
        processor = FileProcessor(args['reduction'], args['animation'], args['log'])
        dfs = {
            'edges': df_edges,
            'categories': df_categories
        }

    if args['radius']:
        processor.set_radius(int(args['radius']))
    if args['limit']:
        processor.set_edges_limit(int(args['limit']))
    if args['rate']:
        processor.set_reducer_rate(float(args['rate']))
    processor.set_datasets(dfs)
    if args['animation']:
        processor.process_animation_files()
    processor.process_files()
    

if __name__=="__main__":
    start_time = time.time()
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("app.log"),
            ##logging.StreamHandler()
        ]
    )
    main()
    print("--- %s seconds ---" % (time.time() - start_time))